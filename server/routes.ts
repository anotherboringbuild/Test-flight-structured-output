import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";
import { insertDocumentSchema, insertFolderSchema } from "@shared/schema";
import OpenAI from "openai";
import fs from "fs";
import { validateExtraction, quickValidationChecks } from "./validation";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema for structured product data
const structuredDataSchema = insertDocumentSchema.pick({ structuredData: true }).shape.structuredData;

// Configure multer for file uploads
const upload = multer({
  dest: "/tmp/uploads",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  try {
    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (fileType === "pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfParseFunc = (pdfParse as any).default || pdfParse;
      const data = await pdfParseFunc(dataBuffer);
      return data.text;
    } else if (fileType === "pages") {
      // Pages files are proprietary zip archives that require specialized parsing
      // For production use, recommend converting to PDF or DOCX first
      throw new Error("Pages format not supported. Please convert to PDF or DOCX format.");
    }
    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error(`Failed to extract text from ${fileType} file`);
  }
}

async function detectLanguage(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a language detection specialist. Identify the primary language of the provided text. Respond with only the language name in English (e.g., 'English', 'Japanese', 'Spanish', 'French', 'German', 'Chinese', 'Korean', etc.)."
        },
        {
          role: "user",
          content: text.slice(0, 2000) // Use first 2000 chars for language detection
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    const language = response.choices[0].message.content?.trim() || "Unknown";
    return language;
  } catch (error) {
    console.error("Language detection error:", error);
    return "Unknown";
  }
}

async function processWithGPT5(extractedText: string): Promise<any> {
  try {
    // Note: Using gpt-4o-2024-08-06 or later for structured outputs
    // This enforces strict JSON schema with guaranteed field order
    
    // Define the copy section schema (reusable for ProductCopy, BusinessCopy, UpgraderCopy)
    const copySectionSchema = {
      type: "object",
      properties: {
        ProductName: {
          type: "string",
          description: "Name of the product this copy is for"
        },
        Headlines: {
          type: "array",
          description: "Array of headline strings",
          items: { type: "string" }
        },
        AdvertisingCopy: {
          type: "string",
          description: "Main advertising copy/description with {{sup:N}} tokens for footnotes"
        },
        KeyFeatureBullets: {
          type: "array",
          description: "Array of feature bullets with {{sup:N}} tokens for footnotes",
          items: { type: "string" }
        },
        LegalReferences: {
          type: "array",
          description: "Legal disclaimers/footnotes, each prefixed with {{sup:N}} token or standalone legal text",
          items: { type: "string" }
        }
      },
      required: ["ProductName", "Headlines", "AdvertisingCopy", "KeyFeatureBullets", "LegalReferences"],
      additionalProperties: false
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are a product documentation extraction specialist. Extract structured product information from the provided text.

LANGUAGE HANDLING:
- **JSON field names** (ProductCopy, BusinessCopy, UpgraderCopy, ProductName, Headlines, AdvertisingCopy, KeyFeatureBullets, LegalReferences) MUST ALWAYS be in English
- **Content values** (product names, headlines, advertising copy, feature bullets, legal references) MUST remain in the source document's original language
- Do NOT translate the content - preserve the exact language from the source document

Documents can contain different copy sections:
- ProductCopy: General product marketing copy
- BusinessCopy: Copy targeted at business customers
- UpgraderCopy: Copy for customers upgrading from previous versions

CRITICAL MULTI-PRODUCT EXTRACTION RULES:
1. **Scan the ENTIRE document** for every product mentioned in EACH section
2. **Look for product headings** like "iPhone 16 Pro Max", "iPhone 16 Pro", "Apple Watch Ultra 2", etc.
3. **Extract EVERY product separately** - do NOT stop after the first product
4. **Each product gets its own entry** in the array for that section
5. Documents often list multiple products in sequence - extract ALL of them
6. If you see a table of contents listing multiple products (e.g., "iPhone 16 Pro Max...2, iPhone 16 Pro...3"), extract copy for EACH product listed

EXAMPLE: If a document has:
- "Product copy" section with iPhone 16 Pro Max, iPhone 16 Pro, iPhone 16 Plus, iPhone 16
- Create FOUR separate entries in ProductCopy array, one for each iPhone model

Each product entry contains: ProductName, Headlines, AdvertisingCopy, KeyFeatureBullets, and LegalReferences (ALWAYS LAST).

CRITICAL: Handle superscripts in THREE distinct ways:

A. FOOTNOTES / CLAIM REFERENCES (¹, ², ³, etc.)
   - Replace with tokens in text: {{sup:1}}, {{sup:2}}, {{sup:3}}
   - Add the SAME token at the START of the corresponding legal reference
   - Example: 
     * In content: "battery for several days{{sup:1}}"
     * In LegalReferences: "{{sup:1}} Battery life varies by use and configuration."

B. LEGAL MARKS (™, ®, ℠)
   - Do NOT include these marks in the text
   - These are just visual indicators, not content

C. UNITS AND SCIENTIFIC NOTATION (cm², H₂O, 10⁶, CO₂e, etc.)
   - Keep as literal Unicode characters
   - These are semantic content, not formatting

Extract sections that exist in the document. If a section is not present, omit it entirely.`,
        },
        {
          role: "user",
          content: extractedText,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction",
          schema: {
            type: "object",
            properties: {
              ProductCopy: {
                anyOf: [
                  {
                    type: "array",
                    items: copySectionSchema,
                    description: "Array of products with general marketing copy"
                  },
                  { type: "null" }
                ],
                description: "General product marketing copy section (optional, can contain multiple products)"
              },
              BusinessCopy: {
                anyOf: [
                  {
                    type: "array",
                    items: copySectionSchema,
                    description: "Array of products with business-focused copy"
                  },
                  { type: "null" }
                ],
                description: "Business-focused copy section (optional, can contain multiple products)"
              },
              UpgraderCopy: {
                anyOf: [
                  {
                    type: "array",
                    items: copySectionSchema,
                    description: "Array of products with upgrade-focused copy"
                  },
                  { type: "null" }
                ],
                description: "Upgrade-focused copy section (optional, can contain multiple products)"
              }
            },
            required: ["ProductCopy", "BusinessCopy", "UpgraderCopy"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const parsedData = JSON.parse(content || "{}");
    
    // Helper function to normalize a single product with correct field order
    const normalizeProduct = (product: any) => {
      return {
        ProductName: product.ProductName || "",
        Headlines: Array.isArray(product.Headlines) ? product.Headlines : [],
        AdvertisingCopy: product.AdvertisingCopy || "",
        KeyFeatureBullets: Array.isArray(product.KeyFeatureBullets) ? product.KeyFeatureBullets : [],
        LegalReferences: Array.isArray(product.LegalReferences) ? product.LegalReferences : [],
      };
    };
    
    // Helper function to normalize a copy section (array of products) with correct field order
    const normalizeCopySection = (section: any) => {
      // Return null if section is null or undefined
      if (!section || section === null) return null;
      
      // Handle array of products
      if (Array.isArray(section)) {
        return section.map(normalizeProduct);
      }
      
      // Handle legacy single product format (for backward compatibility)
      return [normalizeProduct(section)];
    };
    
    // CRITICAL: Explicitly reconstruct the object in the correct order
    // This ensures JSON.stringify outputs fields in this exact sequence
    const normalized: any = {};
    
    // Add sections in order, only if they're not null
    const productCopy = normalizeCopySection(parsedData.ProductCopy);
    if (productCopy !== null) {
      normalized.ProductCopy = productCopy;
    }
    
    const businessCopy = normalizeCopySection(parsedData.BusinessCopy);
    if (businessCopy !== null) {
      normalized.BusinessCopy = businessCopy;
    }
    
    const upgraderCopy = normalizeCopySection(parsedData.UpgraderCopy);
    if (upgraderCopy !== null) {
      normalized.UpgraderCopy = upgraderCopy;
    }
    
    // Verify the order is correct by stringifying and re-parsing
    // This guarantees consistent field order in storage
    return JSON.parse(JSON.stringify(normalized));
  } catch (error) {
    console.error("GPT processing error:", error);
    throw new Error("Failed to process document with AI");
  }
}

// Helper function to analyze document structure
function analyzeDocumentStructure(structuredData: any) {
  if (!structuredData) {
    return {
      hasProductCopy: false,
      hasBusinessCopy: false,
      hasUpgraderCopy: false,
      productCopyCompleteness: null,
      businessCopyCompleteness: null,
      upgraderCopyCompleteness: null,
      productNames: { ProductCopy: [], BusinessCopy: [], UpgraderCopy: [] },
    };
  }

  // Analyze a single product
  const analyzeProduct = (product: any) => {
    return {
      productName: product.ProductName || "",
      hasProductName: !!product.ProductName && product.ProductName.length > 0,
      hasHeadlines: Array.isArray(product.Headlines) && product.Headlines.length > 0,
      hasAdvertisingCopy: !!product.AdvertisingCopy && product.AdvertisingCopy.length > 0,
      hasKeyFeatureBullets: Array.isArray(product.KeyFeatureBullets) && product.KeyFeatureBullets.length > 0,
      hasLegalReferences: Array.isArray(product.LegalReferences) && product.LegalReferences.length > 0,
      headlinesCount: Array.isArray(product.Headlines) ? product.Headlines.length : 0,
      keyFeatureBulletsCount: Array.isArray(product.KeyFeatureBullets) ? product.KeyFeatureBullets.length : 0,
      legalReferencesCount: Array.isArray(product.LegalReferences) ? product.LegalReferences.length : 0,
    };
  };

  // Analyze a copy section (array of products)
  const analyzeCopySection = (section: any) => {
    if (!section) return null;
    
    // Handle array of products (new format)
    if (Array.isArray(section)) {
      return section.map(analyzeProduct);
    }
    
    // Handle legacy single product format
    return [analyzeProduct(section)];
  };

  const productCopyAnalysis = analyzeCopySection(structuredData.ProductCopy);
  const businessCopyAnalysis = analyzeCopySection(structuredData.BusinessCopy);
  const upgraderCopyAnalysis = analyzeCopySection(structuredData.UpgraderCopy);

  return {
    hasProductCopy: !!structuredData.ProductCopy && (!Array.isArray(structuredData.ProductCopy) || structuredData.ProductCopy.length > 0),
    hasBusinessCopy: !!structuredData.BusinessCopy && (!Array.isArray(structuredData.BusinessCopy) || structuredData.BusinessCopy.length > 0),
    hasUpgraderCopy: !!structuredData.UpgraderCopy && (!Array.isArray(structuredData.UpgraderCopy) || structuredData.UpgraderCopy.length > 0),
    productCopyCompleteness: productCopyAnalysis,
    businessCopyCompleteness: businessCopyAnalysis,
    upgraderCopyCompleteness: upgraderCopyAnalysis,
    productNames: {
      ProductCopy: productCopyAnalysis ? productCopyAnalysis.map(p => p.productName) : [],
      BusinessCopy: businessCopyAnalysis ? businessCopyAnalysis.map(p => p.productName) : [],
      UpgraderCopy: upgraderCopyAnalysis ? upgraderCopyAnalysis.map(p => p.productName) : [],
    },
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const allDocuments = await storage.getAllDocuments();
      const processedDocuments = allDocuments.filter(doc => doc.isProcessed);
      
      let productCopyCount = 0;
      let businessCopyCount = 0;
      let upgraderCopyCount = 0;
      let totalProductsExtracted = 0;
      
      let emptyKeyFeatureBulletsCount = 0;
      let documentsWithMissingFields = 0;
      
      const documentAnalysis = processedDocuments.map(doc => {
        const analysis = analyzeDocumentStructure(doc.structuredData);
        
        if (analysis.hasProductCopy) productCopyCount++;
        if (analysis.hasBusinessCopy) businessCopyCount++;
        if (analysis.hasUpgraderCopy) upgraderCopyCount++;
        
        // Count total products across all sections
        totalProductsExtracted += analysis.productNames.ProductCopy.length;
        totalProductsExtracted += analysis.productNames.BusinessCopy.length;
        totalProductsExtracted += analysis.productNames.UpgraderCopy.length;
        
        // Check for empty KeyFeatureBullets in any product across all sections
        const checkEmptyBullets = (products: any[] | null) => {
          if (!products || !Array.isArray(products)) return false;
          return products.some(p => !p.hasKeyFeatureBullets);
        };
        
        const hasEmptyBullets = 
          checkEmptyBullets(analysis.productCopyCompleteness) ||
          checkEmptyBullets(analysis.businessCopyCompleteness) ||
          checkEmptyBullets(analysis.upgraderCopyCompleteness);
        
        if (hasEmptyBullets) emptyKeyFeatureBulletsCount++;
        
        // Check if any product has missing required fields
        const checkCompleteness = (products: any[] | null) => {
          if (!products || !Array.isArray(products)) return false;
          return products.some(p => 
            !p.hasProductName || !p.hasHeadlines || 
            !p.hasAdvertisingCopy || !p.hasLegalReferences
          );
        };
        
        if (checkCompleteness(analysis.productCopyCompleteness) ||
            checkCompleteness(analysis.businessCopyCompleteness) ||
            checkCompleteness(analysis.upgraderCopyCompleteness)) {
          documentsWithMissingFields++;
        }
        
        return {
          id: doc.id,
          name: doc.name,
          ...analysis,
        };
      });
      
      res.json({
        totalDocuments: allDocuments.length,
        processedDocuments: processedDocuments.length,
        unprocessedDocuments: allDocuments.length - processedDocuments.length,
        totalProductsExtracted,
        sectionCoverage: {
          productCopy: productCopyCount,
          businessCopy: businessCopyCount,
          upgraderCopy: upgraderCopyCount,
        },
        qualityMetrics: {
          documentsWithEmptyKeyFeatureBullets: emptyKeyFeatureBulletsCount,
          documentsWithMissingFields: documentsWithMissingFields,
        },
        documentAnalysis,
      });
    } catch (error: any) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });

  // Folders
  app.get("/api/folders", async (req, res) => {
    try {
      const folders = await storage.getAllFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const validatedData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(validatedData);
      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(400).json({ error: "Failed to create folder" });
    }
  });

  app.patch("/api/folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const folder = await storage.updateFolder(id, req.body);
      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
      res.json(folder);
    } catch (error) {
      console.error("Error updating folder:", error);
      res.status(400).json({ error: "Failed to update folder" });
    }
  });

  app.delete("/api/folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFolder(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(400).json({ error: "Failed to delete folder" });
    }
  });

  // Documents
  app.get("/api/documents", async (req, res) => {
    try {
      const { folderId } = req.query;
      const documents = folderId
        ? await storage.getDocumentsByFolder(folderId as string)
        : await storage.getAllDocuments();
      // Remove filePath from all documents for security
      const safeDocuments = documents.map(({ filePath: _, ...doc }) => doc);
      res.json(safeDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = document;
      res.json(safeDocument);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Get all documents in the same folder (language variants)
  app.get("/api/documents/:id/folder-variants", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // If document is not in a folder, return only itself
      if (!document.folderId) {
        const { filePath: _, ...safeDocument } = document;
        return res.json([safeDocument]);
      }

      // Get all documents in the same folder
      const folderDocuments = await storage.getDocumentsByFolder(document.folderId);
      
      // Remove filePath from all documents for security and filter only processed ones
      const safeDocuments = folderDocuments
        .filter(doc => doc.isProcessed)
        .map(({ filePath: _, ...doc }) => doc);
      
      res.json(safeDocuments);
    } catch (error) {
      console.error("Error fetching folder variants:", error);
      res.status(500).json({ error: "Failed to fetch folder variants" });
    }
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { folderId, month, year } = req.body;
      const file = req.file;
      const fileType = file.originalname.split(".").pop()?.toLowerCase() || "";

      // Extract text from the uploaded file
      const extractedText = await extractTextFromFile(file.path, fileType);

      // Detect language and process with GPT-4o in parallel
      const [language, structuredData] = await Promise.all([
        detectLanguage(extractedText),
        processWithGPT5(extractedText)
      ]);

      // Save document to database
      let document = await storage.createDocument({
        name: file.originalname,
        fileType,
        filePath: file.path,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        folderId: folderId || null,
        language,
        month: month || null,
        year: year || null,
        isProcessed: true,
        extractedText,
        structuredData,
      });

      // Automatically validate the extraction
      try {
        const quickCheck = quickValidationChecks(structuredData);
        const validationResult = await validateExtraction(extractedText, structuredData);
        const allIssues = [...quickCheck.issues, ...validationResult.issues];
        const needsReview = !validationResult.passedValidation || !quickCheck.passed;

        // Update document with validation results
        document = await storage.updateDocument(document.id, {
          validationConfidence: validationResult.confidence,
          validationIssues: allIssues,
          needsReview,
        }) || document;
      } catch (validationError) {
        console.error("Validation error during upload:", validationError);
        // Continue with upload even if validation fails
      }

      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = document;
      res.json(safeDocument);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload document" });
    }
  });

  app.post("/api/documents/upload-set", upload.array("files", 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const { folderName, folderDescription, originalIndex: originalIndexStr, folderId, month, year } = req.body;
      
      const originalIndex = Number(originalIndexStr ?? 0);
      
      // Validate that originalIndex is a valid integer
      if (!Number.isInteger(originalIndex)) {
        return res.status(400).json({ error: "Original file index must be a valid integer" });
      }
      
      if (originalIndex < 0 || originalIndex >= req.files.length) {
        return res.status(400).json({ error: "Invalid original file index: out of range" });
      }

      // Create folder if folderName provided and no folderId, otherwise use existing folder
      let targetFolderId = folderId || null;
      let createdFolder = null;
      
      if (folderName && !folderId) {
        // Create a new folder for this multi-document upload
        createdFolder = await storage.createFolder({
          name: folderName,
          description: folderDescription || null,
        });
        targetFolderId = createdFolder.id;
      }

      const uploadedDocuments = [];

      // Process all files
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileType = file.originalname.split(".").pop()?.toLowerCase() || "";
        const isOriginal = i === originalIndex;

        try {
          // Extract text from the uploaded file
          const extractedText = await extractTextFromFile(file.path, fileType);

          // Detect language and process with GPT-4o in parallel
          const [language, structuredData] = await Promise.all([
            detectLanguage(extractedText),
            processWithGPT5(extractedText)
          ]);

          // Save document to database
          let document = await storage.createDocument({
            name: file.originalname,
            fileType,
            filePath: file.path,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            folderId: targetFolderId,
            isOriginal,
            language,
            month: month || null,
            year: year || null,
            isProcessed: true,
            extractedText,
            structuredData,
          });

          // Automatically validate the extraction
          try {
            const quickCheck = quickValidationChecks(structuredData);
            const validationResult = await validateExtraction(extractedText, structuredData);
            const allIssues = [...quickCheck.issues, ...validationResult.issues];
            const needsReview = !validationResult.passedValidation || !quickCheck.passed;

            // Update document with validation results
            document = await storage.updateDocument(document.id, {
              validationConfidence: validationResult.confidence,
              validationIssues: allIssues,
              needsReview,
            }) || document;
          } catch (validationError) {
            console.error("Validation error during upload:", validationError);
            // Continue with upload even if validation fails
          }

          // Remove filePath from response for security
          const { filePath: _, ...safeDocument } = document;
          uploadedDocuments.push(safeDocument);
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          // Continue with other files even if one fails
          uploadedDocuments.push({
            name: file.originalname,
            error: error instanceof Error ? error.message : "Failed to process file",
          });
        }
      }

      res.json({
        folder: createdFolder,
        documents: uploadedDocuments,
      });
    } catch (error) {
      console.error("Document set upload error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload document set" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // If marking a document as original, unmark all other documents in the same folder
      if (req.body.isOriginal === true) {
        // Fetch current document to get its folderId if not provided in payload
        const currentDoc = await storage.getDocument(id);
        if (!currentDoc) {
          return res.status(404).json({ error: "Document not found" });
        }
        
        // Use folderId from payload or current document
        const targetFolderId = req.body.folderId !== undefined ? req.body.folderId : currentDoc.folderId;
        
        if (targetFolderId) {
          const documentsInFolder = await storage.getDocumentsByFolder(targetFolderId);
          for (const doc of documentsInFolder) {
            if (doc.id !== id && doc.isOriginal) {
              await storage.updateDocument(doc.id, { isOriginal: false });
            }
          }
        }
      }
      
      const document = await storage.updateDocument(id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = document;
      res.json(safeDocument);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ error: "Failed to update document" });
    }
  });

  app.post("/api/documents/:id/reprocess", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Re-extract text from the file
      const extractedText = await extractTextFromFile(document.filePath, document.fileType);

      // Re-detect language and reprocess with GPT-4o in parallel
      const [language, structuredData] = await Promise.all([
        detectLanguage(extractedText),
        processWithGPT5(extractedText)
      ]);

      // Update the document with new structured data
      const updatedDocument = await storage.updateDocument(id, {
        extractedText,
        language,
        structuredData,
        isProcessed: true,
      });

      if (!updatedDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = updatedDocument;
      res.json(safeDocument);
    } catch (error) {
      console.error("Reprocess error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to reprocess document" });
    }
  });

  app.post("/api/documents/:id/translate", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.extractedText) {
        return res.status(400).json({ error: "Document has no extracted text to translate" });
      }

      // Translate the extracted text to English using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional translator. Translate the provided text to English. Maintain all formatting, structure, and superscript markers (like ¹, ², ³, etc.). Only translate the content, not the structure.",
          },
          {
            role: "user",
            content: document.extractedText,
          },
        ],
        temperature: 0.3,
      });

      const translatedText = response.choices[0].message.content || "";

      // Update the document with the translated text
      const updatedDocument = await storage.updateDocument(id, {
        translatedText,
      });

      if (!updatedDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = updatedDocument;
      res.json(safeDocument);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to translate document" });
    }
  });

  app.post("/api/documents/:id/validate", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.extractedText || !document.structuredData) {
        return res.status(400).json({ error: "Document must be processed before validation" });
      }

      // Run quick validation checks first
      const quickCheck = quickValidationChecks(document.structuredData);
      
      // Run full AI validation
      const validationResult = await validateExtraction(
        document.extractedText,
        document.structuredData
      );

      // Combine quick check issues with AI validation issues
      const allIssues = [...quickCheck.issues, ...validationResult.issues];
      const needsReview = !validationResult.passedValidation || !quickCheck.passed;

      // Update document with validation results
      const updatedDocument = await storage.updateDocument(id, {
        validationConfidence: validationResult.confidence,
        validationIssues: allIssues,
        needsReview,
      });

      if (!updatedDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = updatedDocument;
      
      // Return updated document with validation metadata
      res.json({
        document: safeDocument,
        validation: {
          confidence: validationResult.confidence,
          issues: allIssues,
          scores: validationResult.scores,
          reasoning: validationResult.reasoning,
          passedValidation: validationResult.passedValidation && quickCheck.passed,
          needsReview,
        }
      });
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to validate document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      if (document) {
        // Clean up the file
        try {
          fs.unlinkSync(document.filePath);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      await storage.deleteDocument(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(400).json({ error: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

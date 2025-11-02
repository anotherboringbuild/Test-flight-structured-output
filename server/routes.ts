import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";
import { insertDocumentSchema, insertFolderSchema } from "@shared/schema";
import OpenAI from "openai";
import fs from "fs";

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

async function processWithGPT5(extractedText: string): Promise<any> {
  try {
    // Note: Using gpt-4o as GPT-5 is not publicly available yet
    // This is the most advanced model for structured JSON extraction
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product documentation extraction specialist. Extract structured product information from the provided text and return it as a JSON object with this exact structure:
{
  "officialProductName": "string",
  "featureCopy": "string (main feature description)",
  "featureBullets": ["string array with 1-20 feature bullet points"],
  "legalBullets": ["string array with 1-20 legal disclaimers or regulatory notes"],
  "advertisingCopy": "string (marketing copy)"
}

Extract all available information. If a field is not present in the text, use reasonable defaults or empty strings/arrays. Ensure the response is valid JSON.`,
        },
        {
          role: "user",
          content: extractedText,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const parsedData = JSON.parse(content || "{}");
    
    // Validate the structure
    if (!parsedData.officialProductName || !parsedData.featureCopy || 
        !Array.isArray(parsedData.featureBullets) || !Array.isArray(parsedData.legalBullets) ||
        !parsedData.advertisingCopy) {
      console.warn("AI response missing required fields, using defaults");
      return {
        officialProductName: parsedData.officialProductName || "Unknown Product",
        featureCopy: parsedData.featureCopy || "",
        featureBullets: Array.isArray(parsedData.featureBullets) ? parsedData.featureBullets : [],
        legalBullets: Array.isArray(parsedData.legalBullets) ? parsedData.legalBullets : [],
        advertisingCopy: parsedData.advertisingCopy || "",
      };
    }
    
    return parsedData;
  } catch (error) {
    console.error("GPT processing error:", error);
    throw new Error("Failed to process document with AI");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    console.log("=== UPLOAD REQUEST RECEIVED ===");
    console.log("File:", req.file?.originalname);
    try {
      if (!req.file) {
        console.log("ERROR: No file in request");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { folderId } = req.body;
      const file = req.file;
      const fileType = file.originalname.split(".").pop()?.toLowerCase() || "";
      console.log("File type:", fileType, "Size:", file.size, "bytes");

      // Extract text from the uploaded file
      console.log("Starting text extraction...");
      const extractedText = await extractTextFromFile(file.path, fileType);
      console.log("Text extracted, length:", extractedText.length, "characters");

      // Process with GPT-5
      console.log("Sending to OpenAI for processing...");
      const structuredData = await processWithGPT5(extractedText);
      console.log("OpenAI processing complete");

      // Save document to database
      console.log("Saving to database...");
      console.log("Document data:", {
        name: file.originalname,
        fileType,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        folderId: folderId || null,
        isProcessed: true,
        extractedTextLength: extractedText.length,
        structuredDataKeys: Object.keys(structuredData || {}),
      });
      
      const document = await storage.createDocument({
        name: file.originalname,
        fileType,
        filePath: file.path,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        folderId: folderId || null,
        isProcessed: true,
        extractedText,
        structuredData,
      }).catch((dbError) => {
        console.error("Database save error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      });

      // Remove filePath from response for security
      const { filePath: _, ...safeDocument } = document;
      console.log("=== UPLOAD COMPLETE ===", "Document ID:", document.id);
      res.json(safeDocument);
    } catch (error) {
      console.error("=== UPLOAD ERROR ===", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.updateDocument(id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ error: "Failed to update document" });
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

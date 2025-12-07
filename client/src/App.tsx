import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import * as XLSX from "xlsx";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { DocumentUploadZone, type UploadData } from "@/components/DocumentUploadZone";
import { DocumentUploadChat } from "@/components/DocumentUploadChat";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ComparisonView } from "@/components/ComparisonView";
import { ExportModal } from "@/components/ExportModal";
import Analytics from "@/pages/Analytics";
import ProductBrowser from "@/pages/ProductBrowser";
import { FolderDialog } from "@/components/FolderDialog";
import { DeleteFolderDialog } from "@/components/DeleteFolderDialog";
import { MoveToFolderDialog } from "@/components/MoveToFolderDialog";
import { DeleteDocumentDialog } from "@/components/DeleteDocumentDialog";
import { useToast } from "@/hooks/use-toast";
import type { Document as DocumentType, Folder as FolderType } from "@shared/schema";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AppContent() {
  const { toast } = useToast();
  
  // View states - no modals
  const [currentView, setCurrentView] = useState<"products" | "upload" | "comparison" | "documents" | "analytics">("products");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingDocument, setExportingDocument] = useState<DocumentType | null>(null);
  const [exportMode, setExportMode] = useState<"document" | "product">("document");
  const [exportProductData, setExportProductData] = useState<any>(null);
  
  // Folder management states
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "edit">("create");
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);
  
  // Document management states
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [movingDocument, setMovingDocument] = useState<DocumentType | null>(null);
  const [showDeleteDocDialog, setShowDeleteDocDialog] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<DocumentType | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch folders
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  // Upload mutation for single documents
  const uploadMutation = useMutation({
    mutationFn: async ({ file, folderId, addToAVA }: { file: File; folderId?: string | null; addToAVA?: boolean }) => {
      console.log("Starting upload for file:", file.name, "to folder:", folderId, "addToAVA:", addToAVA);
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) {
        formData.append("folderId", folderId);
      }
      if (addToAVA) {
        formData.append("addToAVA", "true");
      }
      
      console.log("Sending POST to /api/documents/upload");
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with error:", errorText);
        let errorMessage = "Upload failed";
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Upload mutation onSuccess called");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Document processed and products extracted successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Upload mutation onError called:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload mutation for document sets
  const uploadSetMutation = useMutation({
    mutationFn: async (uploadData: UploadData) => {
      if (uploadData.mode !== "set") {
        throw new Error("Invalid upload mode");
      }

      console.log("Starting folder upload:", uploadData.folderName);
      const formData = new FormData();
      
      // Append all files
      uploadData.files.forEach((file) => {
        formData.append("files", file);
      });
      
      // Append metadata
      formData.append("folderName", uploadData.folderName);
      if (uploadData.folderDescription) {
        formData.append("folderDescription", uploadData.folderDescription);
      }
      formData.append("originalIndex", uploadData.originalIndex.toString());
      if (uploadData.folderId) {
        formData.append("folderId", uploadData.folderId);
      }
      if (uploadData.addToAVA) {
        formData.append("addToAVA", "true");
      }

      const response = await fetch("/api/documents/upload-set", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Document set upload failed:", errorText);
        let errorMessage = "Document set upload failed";
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Document set upload successful:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Document set upload mutation onSuccess called");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: `Folder "${data.folder?.name || 'documents'}" with ${data.documents.length} file(s) processed and products extracted successfully`,
      });
      setCurrentView("products");
    },
    onError: (error: Error) => {
      console.error("Document set upload mutation onError called:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/documents/${id}`, { structuredData: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Saved",
        description: "Changes saved successfully",
      });
    },
  });

  // Folder mutations
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/folders", { name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Folder created",
        description: "Your new folder has been created.",
      });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      return await apiRequest("PATCH", `/api/folders/${id}`, { name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Folder renamed",
        description: "Folder has been renamed successfully.",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Folder deleted",
        description: "The folder has been deleted.",
      });
    },
  });

  const moveDocumentMutation = useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      return await apiRequest("PATCH", `/api/documents/${id}`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Document moved",
        description: "The document has been moved successfully.",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setSelectedDocumentId(null);
      setCurrentView("products");
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    },
  });

  const reprocessDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/documents/${id}/reprocess`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Reprocessing complete",
        description: "Document has been reprocessed and products updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reprocessing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const translateDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/documents/${id}/translate`);
    },
    onSuccess: (updatedDocument: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      // Update the selectedDocument immediately so translatedText is available
      if (selectedDocumentId === updatedDocument.id) {
        queryClient.setQueryData<DocumentType[]>(["/api/documents"], (old) => {
          if (!old) return old;
          return old.map((doc) => (doc.id === updatedDocument.id ? updatedDocument : doc));
        });
      }
      toast({
        title: "Translation complete",
        description: "Document has been translated to English.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Translation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/documents/${id}/validate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Validation complete",
        description: "Document has been validated by AI-as-a-Judge.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Validation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renameDocumentMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiRequest("PATCH", `/api/documents/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document renamed",
        description: "Document has been renamed successfully.",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await Promise.all(ids.map((id) => apiRequest("DELETE", `/api/documents/${id}`)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Documents deleted",
        description: `${ids.length} document(s) deleted successfully.`,
      });
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      return await Promise.all(
        ids.map((id) => apiRequest("PATCH", `/api/documents/${id}`, { folderId }))
      );
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Documents moved",
        description: `${ids.length} document(s) moved successfully.`,
      });
    },
  });

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  const handleUpload = async (files: File[]) => {
    console.log("handleUpload called with files:", files);
    
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select a .docx or .pdf file to upload",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Processing",
      description: `Uploading and processing ${files.length} file(s) with AI...`,
    });

    for (const file of files) {
      console.log("Uploading file:", file.name, file.type);
      try {
        await uploadMutation.mutateAsync({ 
          file, 
          folderId: selectedFolderId
        });
      } catch (error) {
        console.error("Error in handleUpload:", error);
        // Error toast is already shown by onError callback
      }
    }
  };

  const handleUploadReady = async (uploadData: UploadData) => {
    if (uploadData.mode === "set") {
      const avaNote = uploadData.addToAVA ? " (will be added to AVA knowledge base)" : "";
      toast({
        title: "Processing",
        description: `Uploading and processing document set "${uploadData.folderName}" with ${uploadData.files.length} file(s)...${avaNote}`,
      });

      // Log AVA flag for future backend implementation
      if (uploadData.addToAVA) {
        console.log("Document set will be added to AVA knowledge base");
      }

      try {
        await uploadSetMutation.mutateAsync(uploadData);
      } catch (error) {
        console.error("Error in handleUploadReady:", error);
        // Error toast is already shown by onError callback
      }
    } else if (uploadData.mode === "single") {
      // Handle single file uploads with metadata
      const avaNote = uploadData.addToAVA ? " (will be added to AVA knowledge base)" : "";
      toast({
        title: "Processing",
        description: `Uploading and processing ${uploadData.files.length} file(s) with AI...${avaNote}`,
      });

      // Log AVA flag for future backend implementation
      if (uploadData.addToAVA) {
        console.log("Documents will be added to AVA knowledge base");
      }

      for (const file of uploadData.files) {
        try {
          await uploadMutation.mutateAsync({ 
            file, 
            folderId: uploadData.folderId,
            addToAVA: uploadData.addToAVA
          });
        } catch (error) {
          console.error("Error in handleUploadReady:", error);
          // Error toast is already shown by onError callback
        }
      }
    }
  };

  const handleDocumentClick = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.isProcessed) {
      setSelectedDocumentId(id);
      setCurrentView("comparison");
    } else {
      toast({
        title: "Document not ready",
        description: "This document is still being processed.",
        variant: "destructive",
      });
    }
  };

  const handleExportProduct = async (documentId: string, productId: string, productName: string, section: string) => {
    try {
      // Fetch all language variants in the folder
      const response = await fetch(`/api/documents/${documentId}/folder-variants`);
      if (!response.ok) {
        throw new Error("Failed to fetch language variants");
      }
      
      const folderDocuments: DocumentType[] = await response.json();
      
      // Extract the product from each document using ProductName matching within the specific section
      // Use the explicit section parameter to prevent cross-section collisions
      const productsByLocale: Record<string, any> = {};
      const missingLocales: string[] = [];
      
      folderDocuments.forEach((doc) => {
        if (!doc.structuredData || !doc.language) return;
        
        const data = doc.structuredData as any;
        const sectionData = data[section];
        
        if (Array.isArray(sectionData)) {
          // Match by ProductName (case-insensitive, trimmed) instead of index
          const matchingProduct = sectionData.find(
            (p: any) => p.ProductName?.trim().toLowerCase() === productName.trim().toLowerCase()
          );
          
          if (matchingProduct) {
            productsByLocale[doc.language] = {
              language: doc.language,
              documentName: doc.name,
              product: matchingProduct,
              isOriginal: doc.isOriginal
            };
          } else {
            // Track missing products for better error reporting
            missingLocales.push(doc.language);
          }
        }
      });
      
      // Warn if some locales don't have this product
      if (missingLocales.length > 0) {
        toast({
          title: "Warning",
          description: `Product "${productName}" not found in ${missingLocales.length} locale(s): ${missingLocales.join(", ")}`,
          variant: "destructive",
        });
      }
      
      // Set the aggregated data and show export modal
      setExportProductData({
        productName,
        section, // Explicit section parameter prevents cross-section collisions
        locales: productsByLocale,
      });
      setExportMode("product");
      setShowExportModal(true);
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to fetch language variants",
        variant: "destructive",
      });
    }
  };

  const handleExportDocument = () => {
    if (selectedDocument && selectedDocument.isProcessed) {
      setExportingDocument(selectedDocument);
      setExportMode("document");
      setShowExportModal(true);
    }
  };

  const handleExport = (format: string, filename: string, templateConfig: any = {}, selectedLocales?: string[]) => {
    // Handle product export
    if (exportMode === "product" && exportProductData) {
      if (format === "xlsx") {
        const wb = XLSX.utils.book_new();
        const locales = selectedLocales || Object.keys(exportProductData.locales);
        
        // Build matrix layout: rows = fields, columns = locales
        const rows: any[][] = [];
        
        // Metadata block
        rows.push(["Product", exportProductData.productName]);
        rows.push(["Section", exportProductData.section]);
        rows.push(["Export Date", new Date().toLocaleDateString()]);
        rows.push([]); // Spacing
        
        // Determine max array lengths across all locales for proper expansion
        let maxHeadlines = 0;
        let maxFeatureBullets = 0;
        let maxLegalReferences = 0;
        
        locales.forEach((locale) => {
          const localeData = exportProductData.locales[locale];
          if (localeData?.product) {
            const p = localeData.product;
            maxHeadlines = Math.max(maxHeadlines, Array.isArray(p.Headlines) ? p.Headlines.length : 0);
            maxFeatureBullets = Math.max(maxFeatureBullets, Array.isArray(p.KeyFeatureBullets) ? p.KeyFeatureBullets.length : 0);
            maxLegalReferences = Math.max(maxLegalReferences, Array.isArray(p.LegalReferences) ? p.LegalReferences.length : 0);
          }
        });
        
        // Header row: Field | Locale1 ★ | Locale2 | ...
        const headerRow = ["Field"];
        locales.forEach((locale) => {
          const localeData = exportProductData.locales[locale];
          // Always include locale column even if data is missing
          headerRow.push(`${locale}${localeData?.isOriginal ? " ★" : ""}`);
        });
        rows.push(headerRow);
        
        // Helper to build a row: [fieldName, locale1Value, locale2Value, ...]
        // Always renders all locale columns, using empty string for missing data
        const buildRow = (fieldName: string, getValue: (locale: string) => string) => {
          const row = [fieldName];
          locales.forEach((locale) => {
            const localeData = exportProductData.locales[locale];
            if (!localeData || !localeData.product) {
              // Missing locale data - render blank cell to maintain column structure
              row.push("");
            } else {
              row.push(getValue(locale));
            }
          });
          rows.push(row);
        };
        
        // ProductName row
        buildRow("ProductName", (locale) => {
          const localeData = exportProductData.locales[locale];
          return localeData?.product?.ProductName || "";
        });
        
        // Headlines (expanded rows)
        for (let i = 0; i < maxHeadlines; i++) {
          buildRow(`Headline ${i + 1}`, (locale) => {
            const headlines = exportProductData.locales[locale]?.product?.Headlines;
            return Array.isArray(headlines) && headlines[i] ? headlines[i] : "";
          });
        }
        
        // AdvertisingCopy row
        buildRow("AdvertisingCopy", (locale) => {
          return exportProductData.locales[locale]?.product?.AdvertisingCopy || "";
        });
        
        // KeyFeatureBullets (expanded rows)
        for (let i = 0; i < maxFeatureBullets; i++) {
          buildRow(`Feature Bullet ${i + 1}`, (locale) => {
            const bullets = exportProductData.locales[locale]?.product?.KeyFeatureBullets;
            return Array.isArray(bullets) && bullets[i] ? bullets[i] : "";
          });
        }
        
        // LegalReferences (expanded rows)
        for (let i = 0; i < maxLegalReferences; i++) {
          buildRow(`Legal Reference ${i + 1}`, (locale) => {
            const legal = exportProductData.locales[locale]?.product?.LegalReferences;
            return Array.isArray(legal) && legal[i] ? legal[i] : "";
          });
        }
        
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        
        // Set column widths: narrow Field column, wide locale columns
        sheet["!cols"] = [
          { wch: 20 }, // Field column
          ...locales.map(() => ({ wch: 40 })) // Locale columns
        ];
        
        XLSX.utils.book_append_sheet(wb, sheet, `${exportProductData.productName.slice(0, 25)} - ${exportProductData.section.slice(0, 5)}`);
        
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        // JSON format for product export
        const locales = selectedLocales || Object.keys(exportProductData.locales);
        const jsonData: any = {
          product: exportProductData.productName,
          section: exportProductData.section,
          locales: {}
        };
        
        locales.forEach((locale) => {
          const localeData = exportProductData.locales[locale];
          if (localeData) {
            jsonData.locales[locale] = localeData.product;
          }
        });
        
        const dataStr = JSON.stringify(jsonData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.${format}`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export successful",
        description: `Product exported across ${selectedLocales?.length || Object.keys(exportProductData.locales).length} locales`,
      });
      return;
    }
    
    // Handle document export
    if (!exportingDocument) return;

    if (format === "xlsx") {
      // Export to Excel with template
      const wb = XLSX.utils.book_new();
      const data = exportingDocument.structuredData as any || {};
      
      // Use default config if not provided
      const config = {
        includeSummary: templateConfig.includeSummary !== false,
        includeRawJSON: templateConfig.includeRawJSON !== false,
        copyTypes: templateConfig.copyTypes || {
          ProductCopy: true,
          BusinessCopy: true,
          UpgraderCopy: true,
        },
        fields: templateConfig.fields || {
          ProductName: true,
          Headlines: true,
          AdvertisingCopy: true,
          KeyFeatureBullets: true,
          LegalReferences: true,
        },
      };

      // Create a summary sheet if enabled
      if (config.includeSummary) {
        const summary = [
          ["Document Summary"],
          ["Name", exportingDocument.name],
          ["Language", exportingDocument.language || "Unknown"],
          ["Extracted Date", new Date().toLocaleDateString()],
          [],
          ["Data Overview"],
          ["ProductCopy Count", Array.isArray(data.ProductCopy) ? data.ProductCopy.length : 0],
          ["BusinessCopy Count", Array.isArray(data.BusinessCopy) ? data.BusinessCopy.length : 0],
          ["UpgraderCopy Count", Array.isArray(data.UpgraderCopy) ? data.UpgraderCopy.length : 0],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summary);
        summarySheet["!cols"] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      }

      // Create sheets for each copy type
      const createCopySheet = (copyType: string, items: any[]) => {
        if (!Array.isArray(items) || items.length === 0) return;
        
        const headers: string[] = [];
        const widths: Array<{ wch: number }> = [];
        
        if (config.fields.ProductName) { headers.push("ProductName"); widths.push({ wch: 20 }); }
        if (config.fields.Headlines) { headers.push("Headlines"); widths.push({ wch: 30 }); }
        if (config.fields.AdvertisingCopy) { headers.push("AdvertisingCopy"); widths.push({ wch: 40 }); }
        if (config.fields.KeyFeatureBullets) { headers.push("KeyFeatureBullets"); widths.push({ wch: 40 }); }
        if (config.fields.LegalReferences) { headers.push("LegalReferences"); widths.push({ wch: 40 }); }
        
        const rows: any[] = [headers];
        
        items.forEach((item) => {
          const row: any[] = [];
          if (config.fields.ProductName) row.push(item.ProductName || "");
          if (config.fields.Headlines) row.push(Array.isArray(item.Headlines) ? item.Headlines.join("; ") : "");
          if (config.fields.AdvertisingCopy) row.push(item.AdvertisingCopy || "");
          if (config.fields.KeyFeatureBullets) row.push(Array.isArray(item.KeyFeatureBullets) ? item.KeyFeatureBullets.join("; ") : "");
          if (config.fields.LegalReferences) row.push(Array.isArray(item.LegalReferences) ? item.LegalReferences.join("; ") : "");
          rows.push(row);
        });
        
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = widths;
        XLSX.utils.book_append_sheet(wb, sheet, copyType);
      };

      if (config.copyTypes.ProductCopy && data.ProductCopy) createCopySheet("ProductCopy", data.ProductCopy);
      if (config.copyTypes.BusinessCopy && data.BusinessCopy) createCopySheet("BusinessCopy", data.BusinessCopy);
      if (config.copyTypes.UpgraderCopy && data.UpgraderCopy) createCopySheet("UpgraderCopy", data.UpgraderCopy);

      // Create raw JSON sheet if enabled
      if (config.includeRawJSON) {
        const jsonSheet = XLSX.utils.json_to_sheet([{ json: JSON.stringify(data, null, 2) }]);
        XLSX.utils.book_append_sheet(wb, jsonSheet, "Raw JSON");
      }

      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else {
      const dataStr = JSON.stringify(exportingDocument.structuredData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Export successful",
      description: `Document exported as ${filename}.${format === "xlsx" ? "Excel" : format}`,
    });
  };

  const handleCreateFolder = () => {
    setFolderDialogMode("create");
    setEditingFolder(null);
    setShowFolderDialog(true);
  };

  const handleEditFolder = (folder: FolderType) => {
    setFolderDialogMode("edit");
    setEditingFolder(folder);
    setShowFolderDialog(true);
  };

  const handleDeleteFolder = (folder: FolderType) => {
    setDeletingFolder(folder);
    setShowDeleteDialog(true);
  };

  const handleFolderSubmit = (name: string, description?: string, parentFolderId?: string | null) => {
    if (folderDialogMode === "create") {
      createFolderMutation.mutate({ name, description });
    } else if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, name, description });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingFolder) {
      deleteFolderMutation.mutate(deletingFolder.id);
      setShowDeleteDialog(false);
      setDeletingFolder(null);
    }
  };

  const handleFolderClick = (id: string) => {
    setSelectedFolderId(id);
    setCurrentView("documents");
  };
  
  const handleViewChange = (view: string) => {
    // Map view names to current view state
    if (view === "upload") {
      setCurrentView("upload");
    } else if (view === "analytics") {
      setCurrentView("analytics");
    } else if (view === "all-documents") {
      setSelectedFolderId(null);
      setCurrentView("documents");
    } else if (view === "products") {
      setCurrentView("products");
    }
  };

  const handleMoveDocument = (document: DocumentType) => {
    setMovingDocument(document);
    setShowMoveDialog(true);
  };

  const handleMoveSubmit = (folderId: string | null) => {
    if (movingDocument) {
      moveDocumentMutation.mutate({
        id: movingDocument.id,
        folderId,
      });
      setShowMoveDialog(false);
      setMovingDocument(null);
    }
  };

  const handleDeleteDocument = (document: DocumentType) => {
    setDeletingDocument(document);
    setShowDeleteDocDialog(true);
  };

  const handleConfirmDeleteDocument = () => {
    if (deletingDocument) {
      deleteDocumentMutation.mutate(deletingDocument.id);
      setShowDeleteDocDialog(false);
      setDeletingDocument(null);
    }
  };

  const handleRenameDocument = (id: string, name: string) => {
    renameDocumentMutation.mutate({ id, name });
  };

  const handleBulkDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    bulkDeleteMutation.mutate(ids);
  };

  const handleBulkMove = (ids: string[], folderId: string | null) => {
    if (ids.length === 0) return;
    bulkMoveMutation.mutate({ ids, folderId });
  };

  const handleBulkExport = (ids: string[]) => {
    if (ids.length === 0) return;
    
    const docsToExport = documents.filter((d) => ids.includes(d.id) && d.isProcessed);
    
    if (docsToExport.length === 0) {
      toast({
        title: "No documents to export",
        description: "Selected documents are not yet processed.",
        variant: "destructive",
      });
      return;
    }

    // Create a combined export for multiple documents
    const combinedData = docsToExport.map((doc) => ({
      name: doc.name,
      data: doc.structuredData,
    }));

    const dataStr = JSON.stringify(combinedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bulk-export-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `${docsToExport.length} document(s) exported successfully.`,
    });
  };

  const handleCreateFolderFromUpload = async (folderName: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: folderName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      const newFolder = await response.json();
      
      // Invalidate folders query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      
      toast({
        title: "Folder created",
        description: `Folder "${folderName}" has been created.`,
      });

      return newFolder.id;
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  // Format documents for sidebar
  const formattedDocuments = documents.map((doc) => ({
    ...doc,
    fileType: doc.fileType as "docx" | "pdf" | "pages",
    date: formatDate(doc.createdAt.toString()),
  }));

  // Calculate folder counts
  const foldersWithCounts = folders.map((folder) => ({
    ...folder,
    count: documents.filter((d) => d.folderId === folder.id).length,
  }));

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar
            folders={foldersWithCounts}
            documents={formattedDocuments}
            currentView="products"
            selectedDocumentId={selectedDocumentId}
            onViewChange={handleViewChange}
            onCreateFolder={handleCreateFolder}
            onFolderClick={handleFolderClick}
            onDocumentClick={handleDocumentClick}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveDocument={handleMoveDocument}
            onDeleteDocument={handleDeleteDocument}
          />
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <TopBar
              onSettingsClick={() => {
                toast({
                  title: "Settings",
                  description: "OpenAI API key is configured via environment variables",
                });
              }}
              hasApiKey={true}
            />
            <main className="flex-1 relative overflow-hidden">
              {/* View-based routing - no modals */}
              {currentView === "products" && (
                <ProductBrowser 
                  onDocumentClick={handleDocumentClick}
                />
              )}
              
              {currentView === "upload" && (
                <div className="h-full overflow-auto">
                  <DocumentUploadChat
                    onFilesSelected={handleUpload}
                    onUploadReady={handleUploadReady}
                    disabled={uploadMutation.isPending || uploadSetMutation.isPending}
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onFolderChange={setSelectedFolderId}
                    onCreateFolder={handleCreateFolderFromUpload}
                  />
                </div>
              )}
              
              {currentView === "comparison" && selectedDocument && (
                <div className="h-full overflow-hidden">
                  <ComparisonView
                    documentId={selectedDocument.id}
                    documentName={selectedDocument.name}
                    extractedText={selectedDocument.extractedText || ""}
                    translatedText={selectedDocument.translatedText}
                    structuredData={
                      selectedDocument.structuredData
                        ? JSON.stringify(selectedDocument.structuredData, null, 2)
                        : ""
                    }
                    language={selectedDocument.language}
                    fileType={selectedDocument.fileType}
                    validationConfidence={selectedDocument.validationConfidence}
                    validationIssues={selectedDocument.validationIssues}
                    needsReview={selectedDocument.needsReview}
                    isProcessing={reprocessDocumentMutation.isPending}
                    isTranslating={translateDocumentMutation.isPending}
                    isValidating={validateDocumentMutation.isPending}
                    folderId={selectedDocument.folderId}
                    onBack={() => setCurrentView("products")}
                    onExport={handleExportDocument}
                    onExportProduct={(productId, productName, section) => {
                      handleExportProduct(selectedDocument.id, productId, productName, section);
                    }}
                    onSave={(newData) => {
                      try {
                        const parsedData = JSON.parse(newData);
                        updateDocumentMutation.mutate({
                          id: selectedDocument.id,
                          data: parsedData,
                        });
                      } catch (error) {
                        toast({
                          title: "Invalid JSON",
                          description: "Please check your JSON syntax and try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    onReprocess={() => {
                      if (selectedDocument.id) {
                        reprocessDocumentMutation.mutate(selectedDocument.id);
                      }
                    }}
                    onTranslate={() => {
                      if (selectedDocument.id) {
                        translateDocumentMutation.mutate(selectedDocument.id);
                      }
                    }}
                    onValidate={() => {
                      if (selectedDocument.id) {
                        validateDocumentMutation.mutate(selectedDocument.id);
                      }
                    }}
                  />
                </div>
              )}
              
              {currentView === "documents" && (
                <div className="h-full overflow-auto">
                  <DocumentLibrary
                    documents={
                      selectedFolderId
                        ? documents.filter((d) => d.folderId === selectedFolderId)
                        : documents
                    }
                    folders={folders}
                    onDocumentClick={handleDocumentClick}
                    onDeleteDocument={handleDeleteDocument}
                    onMoveDocument={handleMoveDocument}
                    onRenameDocument={handleRenameDocument}
                    onBulkDelete={handleBulkDelete}
                    onBulkMove={handleBulkMove}
                    onBulkExport={handleBulkExport}
                  />
                </div>
              )}
              
              {currentView === "analytics" && (
                <div className="h-full overflow-auto">
                  <Analytics />
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Export Modal - only modal remaining */}
        {(exportingDocument || exportProductData) && (
          <ExportModal
            open={showExportModal}
            onClose={() => {
              setShowExportModal(false);
              setExportingDocument(null);
              setExportProductData(null);
            }}
            onExport={handleExport}
            documentName={exportMode === "document" ? exportingDocument?.name || "" : exportProductData?.productName || ""}
            jsonData={
              exportMode === "document" && exportingDocument?.structuredData
                ? JSON.stringify(exportingDocument.structuredData, null, 2)
                : "{}"
            }
            exportMode={exportMode}
            productData={exportMode === "product" ? exportProductData : undefined}
          />
        )}

        <FolderDialog
          open={showFolderDialog}
          onClose={() => setShowFolderDialog(false)}
          onSubmit={handleFolderSubmit}
          initialName={editingFolder?.name || ""}
          initialDescription={editingFolder?.description || ""}
          initialParentFolderId={editingFolder?.parentFolderId || null}
          mode={folderDialogMode}
          folders={folders}
        />

        <DeleteFolderDialog
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeletingFolder(null);
          }}
          onConfirm={handleConfirmDelete}
          folderName={deletingFolder?.name || ""}
          documentCount={
            deletingFolder
              ? documents.filter((d) => d.folderId === deletingFolder.id).length
              : 0
          }
        />

        <MoveToFolderDialog
          open={showMoveDialog}
          onClose={() => {
            setShowMoveDialog(false);
            setMovingDocument(null);
          }}
          onSubmit={handleMoveSubmit}
          folders={folders}
          currentFolderId={movingDocument?.folderId}
          documentName={movingDocument?.name || ""}
        />

        <DeleteDocumentDialog
          open={showDeleteDocDialog}
          onClose={() => {
            setShowDeleteDocDialog(false);
            setDeletingDocument(null);
          }}
          onConfirm={handleConfirmDeleteDocument}
          documentName={deletingDocument?.name || ""}
        />

        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

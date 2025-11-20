import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { DocumentUploadZone, type UploadData } from "@/components/DocumentUploadZone";
import { DocumentUploadChat } from "@/components/DocumentUploadChat";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ComparisonView } from "@/components/ComparisonView";
import { ExportModal } from "@/components/ExportModal";
import Analytics from "@/pages/Analytics";
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
  const [currentView, setCurrentView] = useState("upload");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingDocument, setExportingDocument] = useState<DocumentType | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "edit">("create");
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [movingDocument, setMovingDocument] = useState<DocumentType | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Auto-populate month and year with current date
  const now = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear().toString();
  
  const [selectedMonth, setSelectedMonth] = useState<string | null>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string | null>(currentYear);
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
    mutationFn: async ({ file, folderId, month, year, addToAVA }: { file: File; folderId?: string | null; month?: string | null; year?: string | null; addToAVA?: boolean }) => {
      console.log("Starting upload for file:", file.name, "to folder:", folderId, "month:", month, "year:", year, "addToAVA:", addToAVA);
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) {
        formData.append("folderId", folderId);
      }
      if (month) {
        formData.append("month", month);
      }
      if (year) {
        formData.append("year", year);
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
      toast({
        title: "Success",
        description: "Document processed successfully",
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
      if (uploadData.month) {
        formData.append("month", uploadData.month);
      }
      if (uploadData.year) {
        formData.append("year", uploadData.year);
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
      toast({
        title: "Success",
        description: `Folder "${data.folder?.name || 'documents'}" with ${data.documents.length} file(s) processed successfully`,
      });
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
      setSelectedDocumentId(null);
      setCurrentView("upload");
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
      toast({
        title: "Reprocessing complete",
        description: "Document has been reprocessed with the latest AI extraction.",
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
          folderId: selectedFolderId,
          month: selectedMonth,
          year: selectedYear
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
            month: uploadData.month,
            year: uploadData.year,
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

  const handleExportDocument = () => {
    if (selectedDocument && selectedDocument.isProcessed) {
      setExportingDocument(selectedDocument);
      setShowExportModal(true);
    }
  };

  const handleExport = (format: string, filename: string) => {
    if (!exportingDocument) return;

    const dataStr = JSON.stringify(exportingDocument.structuredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${format}`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Document exported as ${filename}.${format}`,
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

  const handleFolderSubmit = (name: string, description?: string) => {
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
    setCurrentView(`folder-${id}`);
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
            currentView={currentView}
            selectedDocumentId={selectedDocumentId}
            onViewChange={(view) => {
              setCurrentView(view);
              setSelectedDocumentId(null);
            }}
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
            <main className={`flex-1 relative ${selectedDocument ? 'overflow-hidden' : 'overflow-auto'}`}>
              {selectedDocument ? (
                <ComparisonView
                  documentName={selectedDocument.name}
                  extractedText={selectedDocument.extractedText || ""}
                  translatedText={selectedDocument.translatedText}
                  structuredData={
                    selectedDocument.structuredData
                      ? JSON.stringify(selectedDocument.structuredData, null, 2)
                      : ""
                  }
                  language={selectedDocument.language}
                  validationConfidence={selectedDocument.validationConfidence}
                  validationIssues={selectedDocument.validationIssues}
                  needsReview={selectedDocument.needsReview}
                  isProcessing={reprocessDocumentMutation.isPending}
                  isTranslating={translateDocumentMutation.isPending}
                  isValidating={validateDocumentMutation.isPending}
                  onBack={() => {
                    setSelectedDocumentId(null);
                    setCurrentView("library");
                  }}
                  onExport={handleExportDocument}
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
              ) : currentView === "library" || currentView.startsWith("folder-") ? (
                <DocumentLibrary
                  documents={
                    currentView.startsWith("folder-")
                      ? documents.filter((d) => d.folderId === currentView.replace("folder-", ""))
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
              ) : currentView === "analytics" ? (
                <Analytics />
              ) : (
                <DocumentUploadChat
                  onFilesSelected={handleUpload}
                  onUploadReady={handleUploadReady}
                  disabled={uploadMutation.isPending || uploadSetMutation.isPending}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onFolderChange={setSelectedFolderId}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  onCreateFolder={handleCreateFolderFromUpload}
                />
              )}
            </main>
          </div>
        </div>

        {exportingDocument && (
          <ExportModal
            open={showExportModal}
            onClose={() => {
              setShowExportModal(false);
              setExportingDocument(null);
            }}
            onExport={handleExport}
            documentName={exportingDocument.name}
            jsonData={
              exportingDocument.structuredData
                ? JSON.stringify(exportingDocument.structuredData, null, 2)
                : "{}"
            }
          />
        )}

        <FolderDialog
          open={showFolderDialog}
          onClose={() => setShowFolderDialog(false)}
          onSubmit={handleFolderSubmit}
          initialName={editingFolder?.name || ""}
          initialDescription={editingFolder?.description || ""}
          mode={folderDialogMode}
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

import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { DocumentUploadZone } from "@/components/DocumentUploadZone";
import { ComparisonView } from "@/components/ComparisonView";
import { ExportModal } from "@/components/ExportModal";
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

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch folders
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document processed successfully",
      });
    },
    onError: (error: Error) => {
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

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  const handleUpload = async (files: File[]) => {
    toast({
      title: "Processing",
      description: `Uploading and processing ${files.length} file(s) with AI...`,
    });

    for (const file of files) {
      await uploadMutation.mutateAsync(file);
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
    toast({
      title: "Create folder",
      description: "Folder creation feature coming soon!",
    });
  };

  const handleFolderClick = (id: string) => {
    setCurrentView(`folder-${id}`);
    toast({
      title: "Folder opened",
      description: `Viewing folder contents...`,
    });
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
            <main className="flex-1 overflow-auto">
              {selectedDocument ? (
                <ComparisonView
                  documentName={selectedDocument.name}
                  extractedText={selectedDocument.extractedText || ""}
                  structuredData={
                    selectedDocument.structuredData
                      ? JSON.stringify(selectedDocument.structuredData, null, 2)
                      : ""
                  }
                  onBack={() => {
                    setSelectedDocumentId(null);
                    setCurrentView("upload");
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
                />
              ) : (
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Upload Document
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Upload a product document to extract structured JSON data using AI
                    </p>
                  </div>
                  <DocumentUploadZone
                    onFilesSelected={handleUpload}
                    disabled={uploadMutation.isPending}
                  />
                  {isLoadingDocuments && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Loading documents...
                    </p>
                  )}
                </div>
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

import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ComparisonView } from "@/components/ComparisonView";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ExportModal } from "@/components/ExportModal";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  fileType: "docx" | "pdf" | "pages";
  size: string;
  date: string;
  isProcessed: boolean;
  extractedText?: string;
  structuredData?: string;
}

interface Folder {
  id: string;
  name: string;
  count: number;
}

function App() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentView, setCurrentView] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [exportingDocument, setExportingDocument] = useState<Document | null>(null);

  const [folders] = useState<Folder[]>([
    { id: "1", name: "Contracts", count: 3 },
    { id: "2", name: "Reports", count: 2 },
    { id: "3", name: "Invoices", count: 0 },
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Annual Report 2024.docx",
      fileType: "docx",
      size: "2.4 MB",
      date: "Nov 2, 2025",
      isProcessed: true,
      extractedText: `Annual Report 2024\n\nExecutive Summary\nThis year has been marked by significant growth and expansion across all business units. Our strategic initiatives have yielded impressive results.\n\nFinancial Overview\nRevenue increased by 24% year-over-year, reaching $150 million in total sales. Operating margins improved to 18%.\n\nMarket Analysis\nOur market share has grown from 15% to 22% in the past year, solidifying our position as an industry leader.`,
      structuredData: JSON.stringify(
        {
          documentType: "Annual Report",
          year: 2024,
          sections: [
            {
              heading: "Executive Summary",
              content: "This year has been marked by significant growth and expansion across all business units. Our strategic initiatives have yielded impressive results.",
              order: 1,
            },
            {
              heading: "Financial Overview",
              content: "Revenue increased by 24% year-over-year, reaching $150 million in total sales. Operating margins improved to 18%.",
              order: 2,
              metrics: {
                revenue: "$150M",
                growth: "24%",
                operatingMargin: "18%",
              },
            },
            {
              heading: "Market Analysis",
              content: "Our market share has grown from 15% to 22% in the past year, solidifying our position as an industry leader.",
              order: 3,
              metrics: {
                marketShare: "22%",
                previousShare: "15%",
              },
            },
          ],
        },
        null,
        2
      ),
    },
    {
      id: "2",
      name: "Contract Agreement.pdf",
      fileType: "pdf",
      size: "1.2 MB",
      date: "Nov 1, 2025",
      isProcessed: true,
      extractedText: `SERVICE AGREEMENT\n\nThis Service Agreement is entered into on November 1, 2025.\n\nParties:\n- Company A (Provider)\n- Company B (Client)\n\nTerms:\n1. Services will be provided for a period of 12 months\n2. Monthly payment of $5,000\n3. 30-day notice required for termination`,
      structuredData: JSON.stringify(
        {
          documentType: "Contract",
          title: "Service Agreement",
          date: "2025-11-01",
          parties: [
            { role: "Provider", name: "Company A" },
            { role: "Client", name: "Company B" },
          ],
          terms: [
            { id: 1, description: "Services will be provided for a period of 12 months" },
            { id: 2, description: "Monthly payment of $5,000" },
            { id: 3, description: "30-day notice required for termination" },
          ],
          financials: {
            monthlyPayment: "$5,000",
            duration: "12 months",
          },
        },
        null,
        2
      ),
    },
    {
      id: "3",
      name: "Meeting Notes.pages",
      fileType: "pages",
      size: "856 KB",
      date: "Oct 30, 2025",
      isProcessed: false,
    },
  ]);

  const handleUpload = (files: File[]) => {
    toast({
      title: "Files uploaded",
      description: `${files.length} file(s) are being processed...`,
    });
    console.log("Uploading files:", files);
  };

  const handleViewDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.isProcessed) {
      setSelectedDocument(doc);
    } else {
      toast({
        title: "Document not ready",
        description: "This document is still being processed.",
        variant: "destructive",
      });
    }
  };

  const handleExportDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.isProcessed) {
      setExportingDocument(doc);
      setShowExportModal(true);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
    toast({
      title: "Document deleted",
      description: "The document has been removed from your library.",
    });
  };

  const handleExport = (format: string, filename: string) => {
    console.log(`Exporting as ${format}: ${filename}`);
    toast({
      title: "Export successful",
      description: `Document exported as ${filename}.${format}`,
    });
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    toast({
      title: "API Key saved",
      description: "Your OpenAI API key has been saved securely.",
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
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar
              folders={folders}
              currentView={currentView}
              onViewChange={setCurrentView}
              onCreateFolder={handleCreateFolder}
              onFolderClick={handleFolderClick}
            />
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 border-b px-4 py-2">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              <TopBar
                onSettingsClick={() => setShowApiKeyModal(true)}
                hasApiKey={!!apiKey}
              />
              <main className="flex-1 overflow-auto p-8">
                {selectedDocument ? (
                  <ComparisonView
                    documentName={selectedDocument.name}
                    extractedText={selectedDocument.extractedText || ""}
                    structuredData={selectedDocument.structuredData || ""}
                    onBack={() => setSelectedDocument(null)}
                    onExport={() => handleExportDocument(selectedDocument.id)}
                    onSave={(newData) => {
                      setDocuments(
                        documents.map((d) =>
                          d.id === selectedDocument.id
                            ? { ...d, structuredData: newData }
                            : d
                        )
                      );
                    }}
                  />
                ) : (
                  <DocumentLibrary
                    documents={documents}
                    onUpload={handleUpload}
                    onView={handleViewDocument}
                    onExport={handleExportDocument}
                    onDelete={handleDeleteDocument}
                  />
                )}
              </main>
            </div>
          </div>

          <ApiKeyModal
            open={showApiKeyModal}
            onClose={() => setShowApiKeyModal(false)}
            onSave={handleSaveApiKey}
            currentApiKey={apiKey}
          />

          {exportingDocument && (
            <ExportModal
              open={showExportModal}
              onClose={() => {
                setShowExportModal(false);
                setExportingDocument(null);
              }}
              onExport={handleExport}
              documentName={exportingDocument.name}
              jsonData={exportingDocument.structuredData || "{}"}
            />
          )}

          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

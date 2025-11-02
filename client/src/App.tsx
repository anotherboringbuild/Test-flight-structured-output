import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { DocumentUploadZone } from "@/components/DocumentUploadZone";
import { ComparisonView } from "@/components/ComparisonView";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ExportModal } from "@/components/ExportModal";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  fileType: "docx" | "pdf" | "pages";
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
  const [currentView, setCurrentView] = useState("upload");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [exportingDocument, setExportingDocument] = useState<Document | null>(null);

  const [folders] = useState<Folder[]>([
    { id: "1", name: "Product Specs", count: 2 },
    { id: "2", name: "Marketing", count: 1 },
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "iPhone 15 Pro Specs.docx",
      fileType: "docx",
      date: "Nov 2, 2025",
      isProcessed: true,
      extractedText: `iPhone 15 Pro - Product Specifications

The most advanced iPhone ever created. Experience the power of A17 Pro chip with breakthrough performance and efficiency.

Key Features:
• Titanium design - Stronger. Lighter. More Pro.
• A17 Pro chip with 6-core GPU delivering console-quality gaming
• ProMotion display with 120Hz adaptive refresh rate
• Advanced 48MP camera system with 5x telephoto lens
• All-day battery life with up to 29 hours video playback
• Customizable Action button for quick shortcuts
• USB-C connectivity with USB 3 speeds

Technical Specifications:
• Display: 6.1-inch Super Retina XDR display
• Storage options: 128GB, 256GB, 512GB, 1TB
• 5G capable (sub-6 GHz and mmWave)
• Face ID for secure authentication
• Emergency SOS via satellite
• Crash Detection

Legal Information:
• Display has rounded corners that follow a beautiful curved design
• Battery life varies by use and configuration
• Actual storage capacity available is less than total capacity
• 5G available in select markets; check with carrier for availability
• Some features may not be available for all countries or regions
• Accessories sold separately
• Screen size measured diagonally`,
      structuredData: JSON.stringify(
        {
          officialProductName: "iPhone 15 Pro",
          featureCopy: "The most advanced iPhone ever created. Experience the power of A17 Pro chip with breakthrough performance and efficiency.",
          featureBullets: [
            "Titanium design - Stronger. Lighter. More Pro.",
            "A17 Pro chip with 6-core GPU delivering console-quality gaming",
            "ProMotion display with 120Hz adaptive refresh rate",
            "Advanced 48MP camera system with 5x telephoto lens",
            "All-day battery life with up to 29 hours video playback",
            "Customizable Action button for quick shortcuts",
            "USB-C connectivity with USB 3 speeds",
            "6.1-inch Super Retina XDR display",
            "Storage options: 128GB, 256GB, 512GB, 1TB",
            "5G capable (sub-6 GHz and mmWave)",
            "Face ID for secure authentication",
            "Emergency SOS via satellite",
            "Crash Detection"
          ],
          legalBullets: [
            "Display has rounded corners that follow a beautiful curved design",
            "Battery life varies by use and configuration",
            "Actual storage capacity available is less than total capacity",
            "5G available in select markets; check with carrier for availability",
            "Some features may not be available for all countries or regions",
            "Accessories sold separately",
            "Screen size measured diagonally"
          ],
          advertisingCopy: "Experience the power of A17 Pro chip with breakthrough performance and efficiency in the most advanced iPhone ever created. With titanium design and professional-grade camera capabilities, iPhone 15 Pro redefines what's possible."
        },
        null,
        2
      ),
    },
    {
      id: "2",
      name: "MacBook Air M3.pdf",
      fileType: "pdf",
      date: "Nov 1, 2025",
      isProcessed: true,
      extractedText: `MacBook Air with M3 Chip

Supercharged by the M3 chip. The world's best-selling laptop just got even better.

Key Features:
• M3 chip with 8-core CPU and up to 10-core GPU
• Up to 18 hours of battery life
• 13.6-inch Liquid Retina display with 500 nits of brightness
• 1080p FaceTime HD camera
• Four-speaker sound system with Spatial Audio
• MagSafe charging port
• Two Thunderbolt ports

Performance:
• Up to 60% faster than M1
• Supports up to two external displays
• 8GB or 16GB unified memory options
• Fanless design for silent operation

Legal:
• Battery life varies by use
• Display size is measured diagonally
• Actual diagonal screen measure is 13.6 inches
• Testing conducted by Apple in February 2024`,
      structuredData: JSON.stringify(
        {
          officialProductName: "MacBook Air with M3 Chip",
          featureCopy: "Supercharged by the M3 chip. The world's best-selling laptop just got even better.",
          featureBullets: [
            "M3 chip with 8-core CPU and up to 10-core GPU",
            "Up to 18 hours of battery life",
            "13.6-inch Liquid Retina display with 500 nits of brightness",
            "1080p FaceTime HD camera",
            "Four-speaker sound system with Spatial Audio",
            "MagSafe charging port",
            "Two Thunderbolt ports",
            "Up to 60% faster than M1",
            "Supports up to two external displays",
            "8GB or 16GB unified memory options",
            "Fanless design for silent operation"
          ],
          legalBullets: [
            "Battery life varies by use",
            "Display size is measured diagonally",
            "Actual diagonal screen measure is 13.6 inches",
            "Testing conducted by Apple in February 2024"
          ],
          advertisingCopy: "The world's best-selling laptop just got even better. MacBook Air with M3 chip delivers up to 60% faster performance with up to 18 hours of battery life, all in a fanless design that stays perfectly silent."
        },
        null,
        2
      ),
    },
    {
      id: "3",
      name: "AirPods Pro Brief.pages",
      fileType: "pages",
      date: "Oct 30, 2025",
      isProcessed: false,
    },
  ]);

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  const handleUpload = (files: File[]) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key to process documents.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Files uploaded",
      description: `${files.length} file(s) are being processed with GPT-5...`,
    });
    console.log("Uploading files:", files);
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
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar
              folders={folders}
              documents={documents}
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
                onSettingsClick={() => setShowApiKeyModal(true)}
                hasApiKey={!!apiKey}
              />
              <main className="flex-1 overflow-auto">
                {selectedDocument ? (
                  <ComparisonView
                    documentName={selectedDocument.name}
                    extractedText={selectedDocument.extractedText || ""}
                    structuredData={selectedDocument.structuredData || ""}
                    onBack={() => {
                      setSelectedDocumentId(null);
                      setCurrentView("upload");
                    }}
                    onExport={handleExportDocument}
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
                  <div className="p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Upload Document
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Upload a product document to extract structured JSON data
                      </p>
                    </div>
                    <DocumentUploadZone onFilesSelected={handleUpload} />
                  </div>
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

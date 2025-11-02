import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const mockFolders = [
    { id: "1", name: "Product Specs", count: 5 },
    { id: "2", name: "Marketing", count: 3 },
  ];

  const mockDocuments = [
    {
      id: "1",
      name: "iPhone 15 Pro Specs.docx",
      fileType: "docx" as const,
      isProcessed: true,
      date: "Nov 2, 2025",
    },
    {
      id: "2",
      name: "MacBook Air M3.pdf",
      fileType: "pdf" as const,
      isProcessed: true,
      date: "Nov 1, 2025",
    },
    {
      id: "3",
      name: "Product Brief.pages",
      fileType: "pages" as const,
      isProcessed: false,
      date: "Oct 30, 2025",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar
          folders={mockFolders}
          documents={mockDocuments}
          currentView="upload"
          selectedDocumentId={null}
          onViewChange={(view) => console.log("View changed:", view)}
          onCreateFolder={() => console.log("Create folder clicked")}
          onFolderClick={(id) => console.log("Folder clicked:", id)}
          onDocumentClick={(id) => console.log("Document clicked:", id)}
        />
      </div>
    </SidebarProvider>
  );
}

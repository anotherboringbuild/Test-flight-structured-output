import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const mockFolders = [
    { id: "1", name: "Contracts", count: 12 },
    { id: "2", name: "Reports", count: 8 },
    { id: "3", name: "Invoices", count: 24 },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar
          folders={mockFolders}
          currentView="all"
          onViewChange={(view) => console.log("View changed:", view)}
          onCreateFolder={() => console.log("Create folder clicked")}
          onFolderClick={(id) => console.log("Folder clicked:", id)}
        />
      </div>
    </SidebarProvider>
  );
}

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { FileText, FolderOpen, Plus, CheckCircle2, Clock as ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  fileType: "docx" | "pdf" | "pages";
  isProcessed: boolean;
  date: string;
}

interface Folder {
  id: string;
  name: string;
  count: number;
}

interface AppSidebarProps {
  folders: Folder[];
  documents: Document[];
  currentView: string;
  selectedDocumentId: string | null;
  onViewChange: (view: string) => void;
  onCreateFolder: () => void;
  onFolderClick: (folderId: string) => void;
  onDocumentClick: (documentId: string) => void;
}

export function AppSidebar({
  folders = [],
  documents = [],
  currentView,
  selectedDocumentId,
  onViewChange,
  onCreateFolder,
  onFolderClick,
  onDocumentClick,
}: AppSidebarProps) {
  const mainItems = [
    { id: "upload", title: "Upload New", icon: FileText },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Documents
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    data-testid={`button-nav-${item.id}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <span>Recent Documents</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px]">
              <SidebarMenu>
                {documents.map((doc) => (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton
                      isActive={selectedDocumentId === doc.id}
                      onClick={() => onDocumentClick(doc.id)}
                      data-testid={`button-document-${doc.id}`}
                      className="flex-col items-start gap-1 h-auto py-2"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate text-sm font-medium">{doc.name}</span>
                        {doc.isProcessed && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {doc.fileType.toUpperCase()}
                        </Badge>
                        <span className="truncate">{doc.date}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <span>Folders</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCreateFolder}
              data-testid="button-create-folder"
              aria-label="Create folder"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[200px]">
              <SidebarMenu>
                {folders.map((folder) => (
                  <SidebarMenuItem key={folder.id}>
                    <SidebarMenuButton
                      isActive={currentView === `folder-${folder.id}`}
                      onClick={() => onFolderClick(folder.id)}
                      data-testid={`button-folder-${folder.id}`}
                    >
                      <FolderOpen className="h-5 w-5" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {folder.count}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <div>{documents.length} document{documents.length !== 1 ? 's' : ''} total</div>
          <div>{documents.filter(d => d.isProcessed).length} processed</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

import { useState } from "react";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, FolderOpen, Plus, CheckCircle2, Pencil, Trash2, Library, BarChart3, ChevronRight, Languages, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

import type { Folder as FolderType, Document as DocumentType } from "@shared/schema";

interface Document extends DocumentType {
  date: string;
}

interface Folder extends FolderType {
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
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onMoveDocument: (document: DocumentType) => void;
  onDeleteDocument: (document: DocumentType) => void;
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
  onEditFolder,
  onDeleteFolder,
  onMoveDocument,
  onDeleteDocument,
}: AppSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const mainItems = [
    { id: "products", title: "Products", icon: Package },
    { id: "upload", title: "Structured Output", icon: FileText },
    { id: "analytics", title: "Analytics", icon: BarChart3 },
  ];

  // Get all documents in a folder
  const getDocumentsForFolder = (folderId: string) => {
    return documents.filter(doc => doc.folderId === folderId);
  };

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getLanguageBadge = (language: string | null | undefined) => {
    if (!language) return null;
    const langCode =
      language === "English" ? "EN" :
      language === "Japanese" ? "JA" :
      language === "Spanish" ? "ES" :
      language === "French" ? "FR" :
      language === "German" ? "DE" :
      language === "Chinese" ? "ZH" :
      language === "Korean" ? "KO" :
      language.slice(0, 2).toUpperCase();
    return langCode;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Objects
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
            <ScrollArea className="h-[400px]">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentView === "all-documents"}
                    onClick={() => onViewChange("all-documents")}
                    data-testid="button-all-documents"
                  >
                    <Library className="h-5 w-5" />
                    <span>All Documents</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {folders.map((folder) => {
                  const folderDocs = getDocumentsForFolder(folder.id);
                  const originalDoc = folderDocs.find(d => d.isOriginal);
                  const variantDocs = folderDocs.filter(d => !d.isOriginal);
                  const isExpanded = expandedFolders.has(folder.id);
                  const hasMultipleDocs = folderDocs.length > 1;

                  return (
                    <SidebarMenuItem key={folder.id}>
                      {hasMultipleDocs ? (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleFolderExpanded(folder.id)}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                  data-testid={`button-folder-${folder.id}`}
                                  className="w-full"
                                >
                                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  <FolderOpen className="h-4 w-4" />
                                  <span className="flex-1 truncate text-left">{folder.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {folderDocs.length}
                                  </Badge>
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => onEditFolder(folder)}
                                data-testid={`button-edit-folder-${folder.id}`}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => onDeleteFolder(folder)}
                                data-testid={`button-delete-folder-${folder.id}`}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                          <CollapsibleContent>
                            <div className="ml-6 mt-1 space-y-1">
                              {originalDoc && (
                                <SidebarMenuButton
                                  isActive={selectedDocumentId === originalDoc.id}
                                  onClick={() => originalDoc.isProcessed && onDocumentClick(originalDoc.id)}
                                  data-testid={`button-document-${originalDoc.id}`}
                                  className="pl-2 h-auto py-1.5"
                                >
                                  <Star className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                                  <span className="flex-1 truncate text-xs">{originalDoc.name}</span>
                                  {originalDoc.isProcessed && (
                                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                                  )}
                                </SidebarMenuButton>
                              )}
                              {variantDocs.map((doc) => (
                                <SidebarMenuButton
                                  key={doc.id}
                                  isActive={selectedDocumentId === doc.id}
                                  onClick={() => doc.isProcessed && onDocumentClick(doc.id)}
                                  data-testid={`button-document-${doc.id}`}
                                  className="pl-2 h-auto py-1.5"
                                >
                                  <Languages className="h-3 w-3" />
                                  <span className="flex-1 truncate text-xs">{doc.name}</span>
                                  <div className="flex items-center gap-1">
                                    {doc.language && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        {getLanguageBadge(doc.language)}
                                      </Badge>
                                    )}
                                    {doc.isProcessed && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    )}
                                  </div>
                                </SidebarMenuButton>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
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
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => onEditFolder(folder)}
                              data-testid={`button-edit-folder-${folder.id}`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => onDeleteFolder(folder)}
                              data-testid={`button-delete-folder-${folder.id}`}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )}
                    </SidebarMenuItem>
                  );
                })}
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

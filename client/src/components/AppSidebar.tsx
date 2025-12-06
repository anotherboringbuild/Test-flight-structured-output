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
} from "@/components/ui/context-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, FolderOpen, Plus, CheckCircle2, Pencil, Trash2, Library, BarChart3, ChevronRight, Languages, Star, Package, Search, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "count">("name");

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

  // Filter and sort folders
  const filteredFolders = folders
    .filter(folder => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      // Search by folder name or document names within folder
      const folderMatches = folder.name.toLowerCase().includes(query);
      const docsInFolder = getDocumentsForFolder(folder.id);
      const docMatches = docsInFolder.some(doc => doc.name.toLowerCase().includes(query));
      return folderMatches || docMatches;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "count") {
        const aCount = getDocumentsForFolder(a.id).length;
        const bCount = getDocumentsForFolder(b.id).length;
        return bCount - aCount;
      } else {
        // Sort by most recent document in folder
        const aDate = Math.max(...getDocumentsForFolder(a.id).map(d => new Date(d.createdAt).getTime()), 0);
        const bDate = Math.max(...getDocumentsForFolder(b.id).map(d => new Date(d.createdAt).getTime()), 0);
        return bDate - aDate;
      }
    });

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Objects
        </h2>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
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

        {/* Folders Section */}
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
            {/* Search and Sort */}
            <div className="px-2 pb-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 pr-7 text-xs"
                  data-testid="input-search-folders"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "date" | "count")}>
                <SelectTrigger className="h-7 text-xs" data-testid="select-sort-folders">
                  <ArrowUpDown className="mr-1 h-3 w-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="count">Sort by Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[350px]">
              <SidebarMenu>
                {/* All Documents */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentView === "all-documents"}
                    onClick={() => onViewChange("all-documents")}
                    data-testid="button-all-documents"
                    className="mb-1"
                  >
                    <Library className="h-4 w-4" />
                    <span className="flex-1">All Documents</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {documents.length}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Folders */}
                {filteredFolders.length === 0 && searchQuery && (
                  <div className="px-2 py-4 text-center">
                    <p className="text-xs text-muted-foreground">No folders found</p>
                  </div>
                )}
                {filteredFolders.map((folder) => {
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
                                  className="w-full group"
                                >
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <ChevronRight className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                    <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="flex-1 truncate text-sm">{folder.name}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 ml-1 flex-shrink-0">
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
                            <div className="ml-8 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                              {originalDoc && (
                                <SidebarMenuButton
                                  isActive={selectedDocumentId === originalDoc.id}
                                  onClick={() => originalDoc.isProcessed && onDocumentClick(originalDoc.id)}
                                  data-testid={`button-document-${originalDoc.id}`}
                                  className="h-auto py-1.5 hover-elevate"
                                >
                                  <Star className="h-3 w-3 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                                  <span className="flex-1 truncate text-xs">{originalDoc.name}</span>
                                  {originalDoc.isProcessed && (
                                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  )}
                                </SidebarMenuButton>
                              )}
                              {variantDocs.map((doc) => (
                                <SidebarMenuButton
                                  key={doc.id}
                                  isActive={selectedDocumentId === doc.id}
                                  onClick={() => doc.isProcessed && onDocumentClick(doc.id)}
                                  data-testid={`button-document-${doc.id}`}
                                  className="h-auto py-1.5 hover-elevate"
                                >
                                  <Languages className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="flex-1 truncate text-xs">{doc.name}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {doc.language && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
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
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 truncate text-sm">{folder.name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {folder.count}
                              </Badge>
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
      <SidebarFooter className="border-t p-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{documents.length} docs</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Processed</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {documents.filter(d => d.isProcessed).length}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

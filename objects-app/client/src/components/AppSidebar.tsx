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
import { FileText, FolderOpen, Plus, CheckCircle2, Pencil, Trash2, Library, BarChart3, ChevronRight, Languages, Star, Package, ArrowUpDown, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [sortBy, setSortBy] = useState<"name" | "date" | "count">("name");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mainItems = [
    { id: "products", title: "Products", icon: Package },
    { id: "upload", title: "Structured Output", icon: FileText },
    { id: "analytics", title: "Analytics", icon: BarChart3 },
  ];

  // Move folder mutation
  const moveFolderMutation = useMutation({
    mutationFn: async ({ folderId, parentFolderId }: { folderId: string; parentFolderId: string | null }) => {
      return apiRequest("POST", `/api/folders/${folderId}/move`, { parentFolderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Folder moved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to move folder", 
        description: error.message || "Could not move folder",
        variant: "destructive" 
      });
    },
  });

  // Move document mutation
  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, folderId }: { documentId: string; folderId: string | null }) => {
      return apiRequest("POST", `/api/documents/${documentId}/move`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Document moved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to move document", 
        description: error.message || "Could not move document",
        variant: "destructive" 
      });
    },
  });

  // Get all documents in a folder
  const getDocumentsForFolder = (folderId: string) => {
    return documents.filter(doc => doc.folderId === folderId);
  };

  // Get child folders
  const getChildFolders = (parentId: string | null) => {
    return folders.filter(f => f.parentFolderId === parentId);
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: "folder" | "document", id: string) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("id", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverId(null);

    const type = e.dataTransfer.getData("type");
    const id = e.dataTransfer.getData("id");

    if (type === "folder") {
      // Moving a folder
      moveFolderMutation.mutate({ folderId: id, parentFolderId: targetFolderId });
    } else if (type === "document") {
      // Moving a document
      moveDocumentMutation.mutate({ documentId: id, folderId: targetFolderId });
    }
  };

  // Sort folders (only root level for initial display)
  const rootFolders = folders.filter(f => !f.parentFolderId);
  
  const filteredRootFolders = rootFolders.sort((a, b) => {
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

  // Recursive folder renderer
  const renderFolder = (folder: Folder, depth: number = 0) => {
    const folderDocs = getDocumentsForFolder(folder.id);
    const originalDoc = folderDocs.find(d => d.isOriginal);
    const variantDocs = folderDocs.filter(d => !d.isOriginal);
    const isExpanded = expandedFolders.has(folder.id);
    const hasMultipleDocs = folderDocs.length > 1;
    const childFolders = getChildFolders(folder.id);
    const hasChildren = childFolders.length > 0 || folderDocs.length > 0;
    const isDragOver = dragOverId === folder.id;

    return (
      <div key={folder.id} className={depth > 0 ? "ml-4" : ""}>
        <SidebarMenuItem>
          {hasMultipleDocs ? (
            <Collapsible open={isExpanded} onOpenChange={() => toggleFolderExpanded(folder.id)}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, "folder", folder.id)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    className={`${isDragOver ? "bg-accent/50 ring-2 ring-primary" : ""}`}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        data-testid={`button-folder-${folder.id}`}
                        className="w-full group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                          <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate text-sm">{folder.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 ml-1 flex-shrink-0">
                          {folderDocs.length + childFolders.length}
                        </Badge>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </div>
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
                  {/* Render child folders */}
                  {childFolders.map(childFolder => renderFolder(childFolder, depth + 1))}
                  
                  {/* Render documents */}
                  {originalDoc && (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, "document", originalDoc.id)}
                    >
                      <SidebarMenuButton
                        isActive={selectedDocumentId === originalDoc.id}
                        onClick={() => originalDoc.isProcessed && onDocumentClick(originalDoc.id)}
                        data-testid={`button-document-${originalDoc.id}`}
                        className="h-auto py-1.5 hover-elevate cursor-grab active:cursor-grabbing"
                      >
                        <Star className="h-3 w-3 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                        <span className="flex-1 truncate text-xs">{originalDoc.name}</span>
                        {originalDoc.isProcessed && (
                          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                      </SidebarMenuButton>
                    </div>
                  )}
                  {variantDocs.map((doc) => (
                    <div
                      key={doc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, "document", doc.id)}
                    >
                      <SidebarMenuButton
                        isActive={selectedDocumentId === doc.id}
                        onClick={() => doc.isProcessed && onDocumentClick(doc.id)}
                        data-testid={`button-document-${doc.id}`}
                        className="h-auto py-1.5 hover-elevate cursor-grab active:cursor-grabbing"
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
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, "folder", folder.id)}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className={`${isDragOver ? "bg-accent/50 ring-2 ring-primary" : ""}`}
                >
                  <SidebarMenuButton
                    isActive={currentView === `folder-${folder.id}`}
                    onClick={() => hasChildren ? toggleFolderExpanded(folder.id) : onFolderClick(folder.id)}
                    data-testid={`button-folder-${folder.id}`}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {hasChildren && (
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                    )}
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">{folder.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {folderDocs.length + childFolders.length}
                    </Badge>
                  </SidebarMenuButton>
                </div>
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

        {/* Render nested children when expanded */}
        {hasChildren && isExpanded && !hasMultipleDocs && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {childFolders.map(childFolder => renderFolder(childFolder, depth + 1))}
            {folderDocs.map(doc => (
              <div
                key={doc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, "document", doc.id)}
              >
                <SidebarMenuButton
                  isActive={selectedDocumentId === doc.id}
                  onClick={() => doc.isProcessed && onDocumentClick(doc.id)}
                  data-testid={`button-document-${doc.id}`}
                  className="h-auto py-1.5 hover-elevate cursor-grab active:cursor-grabbing"
                >
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate text-xs">{doc.name}</span>
                  {doc.isProcessed && (
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                </SidebarMenuButton>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
            {/* Sort */}
            <div className="px-2 pb-2">
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
                {/* All Documents - Drop zone for root level */}
                <SidebarMenuItem>
                  <div
                    onDragOver={(e) => handleDragOver(e, null)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, null)}
                    className={`${dragOverId === null ? "bg-accent/50 ring-2 ring-primary" : ""}`}
                  >
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
                  </div>
                </SidebarMenuItem>

                {/* Folders */}
                {filteredRootFolders.map(folder => renderFolder(folder, 0))}
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

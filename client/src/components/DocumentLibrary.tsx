import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  FolderInput,
  Trash2,
  MoreVertical,
  FileText,
  Edit,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Document as DocumentType, Folder as FolderType } from "@shared/schema";

interface DocumentLibraryProps {
  documents: DocumentType[];
  folders: FolderType[];
  onDocumentClick: (id: string) => void;
  onDeleteDocument: (doc: DocumentType) => void;
  onMoveDocument: (doc: DocumentType) => void;
  onRenameDocument: (id: string, name: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkMove: (ids: string[], folderId: string | null) => void;
  onBulkExport: (ids: string[]) => void;
}

type SortField = "name" | "date" | "size";
type SortDirection = "asc" | "desc";

function formatFileSize(size: string): number {
  const match = size.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "KB") return value;
  if (unit === "MB") return value * 1024;
  if (unit === "GB") return value * 1024 * 1024;
  return value;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocumentLibrary({
  documents,
  folders,
  onDocumentClick,
  onDeleteDocument,
  onMoveDocument,
  onRenameDocument,
  onBulkDelete,
  onBulkMove,
  onBulkExport,
}: DocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFolder, setFilterFolder] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renamingDoc, setRenamingDoc] = useState<DocumentType | null>(null);
  const [newName, setNewName] = useState("");

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(query)
      );
    }

    // Apply folder filter
    if (filterFolder !== "all") {
      if (filterFolder === "none") {
        filtered = filtered.filter((doc) => !doc.folderId);
      } else {
        filtered = filtered.filter((doc) => doc.folderId === filterFolder);
      }
    }

    // Apply file type filter
    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.fileType === filterType);
    }

    // Apply processing status filter
    if (filterStatus !== "all") {
      const isProcessed = filterStatus === "processed";
      filtered = filtered.filter((doc) => doc.isProcessed === isProcessed);
    }

    // Apply month filter
    if (filterMonth !== "all") {
      if (filterMonth === "none") {
        filtered = filtered.filter((doc) => !doc.month);
      } else {
        filtered = filtered.filter((doc) => doc.month === filterMonth);
      }
    }

    // Apply year filter
    if (filterYear !== "all") {
      if (filterYear === "none") {
        filtered = filtered.filter((doc) => !doc.year);
      } else {
        filtered = filtered.filter((doc) => doc.year === filterYear);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "size") {
        comparison = formatFileSize(a.size) - formatFileSize(b.size);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [documents, searchQuery, filterFolder, filterType, filterStatus, filterMonth, filterYear, sortField, sortDirection]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedDocuments.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleRename = (doc: DocumentType) => {
    setRenamingDoc(doc);
    setNewName(doc.name);
    setShowRenameDialog(true);
  };

  const handleRenameSubmit = () => {
    if (renamingDoc && newName.trim()) {
      onRenameDocument(renamingDoc.id, newName.trim());
      setShowRenameDialog(false);
      setRenamingDoc(null);
      setNewName("");
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size > 0) {
      onBulkExport(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "No Folder";
    return folders.find((f) => f.id === folderId)?.name || "Unknown";
  };

  const allSelected = selectedIds.size === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredAndSortedDocuments.length;

  // Get unique months and years from documents
  const uniqueMonths = Array.from(new Set(documents.map((d) => d.month).filter(Boolean))) as string[];
  const uniqueYears = Array.from(new Set(documents.map((d) => d.year).filter(Boolean))).sort() as string[];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Document Library</h2>
        <p className="text-sm text-muted-foreground">
          Manage, search, and organize your documents
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-documents"
            />
          </div>
          <Select value={filterFolder} onValueChange={setFilterFolder}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-folder">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              <SelectItem value="none">No Folder</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="docx">DOCX</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="pages">Pages</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-month">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="none">No Month</SelectItem>
              {months.filter((month) => uniqueMonths.includes(month)).map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[120px]" data-testid="select-filter-year">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="none">No Year</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              data-testid="button-toggle-sort-direction"
            >
              {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[140px]" data-testid="select-sort-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedIds.size} selected</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                data-testid="button-bulk-export"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedIds.size > 0) {
                    const firstDoc = documents.find((d) => selectedIds.has(d.id));
                    if (firstDoc) {
                      onBulkMove(Array.from(selectedIds), firstDoc.folderId);
                    }
                  }
                }}
                data-testid="button-bulk-move"
              >
                <FolderInput className="mr-2 h-4 w-4" />
                Move
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 rounded-md border bg-muted/30 px-4 py-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              data-testid="checkbox-select-all"
            />
            {someSelected && !allSelected ? (
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            ) : allSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">Name</div>
          <div className="w-32">Folder</div>
          <div className="w-24">Type</div>
          <div className="w-20">Language</div>
          <div className="w-24">Size</div>
          <div className="w-32">Date</div>
          <div className="w-20">Status</div>
          <div className="w-10"></div>
        </div>

        {filteredAndSortedDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 rounded-md border bg-card px-4 py-3 text-sm hover-elevate active-elevate-2"
              data-testid={`document-row-${doc.id}`}
            >
              <Checkbox
                checked={selectedIds.has(doc.id)}
                onCheckedChange={() => toggleSelect(doc.id)}
                data-testid={`checkbox-document-${doc.id}`}
              />
              <div
                className="flex-1 cursor-pointer font-medium"
                onClick={() => doc.isProcessed && onDocumentClick(doc.id)}
                data-testid={`text-document-name-${doc.id}`}
              >
                {doc.name}
              </div>
              <div className="w-32 truncate text-muted-foreground">
                {getFolderName(doc.folderId)}
              </div>
              <div className="w-24">
                <Badge variant="outline">{doc.fileType.toUpperCase()}</Badge>
              </div>
              <div className="w-20">
                {doc.language && (
                  <Badge variant="secondary" className="text-xs">
                    {doc.language === "English" ? "EN" : 
                     doc.language === "Japanese" ? "JA" :
                     doc.language === "Spanish" ? "ES" :
                     doc.language === "French" ? "FR" :
                     doc.language === "German" ? "DE" :
                     doc.language === "Chinese" ? "ZH" :
                     doc.language === "Korean" ? "KO" :
                     doc.language.slice(0, 2).toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="w-24 text-muted-foreground">{doc.size}</div>
              <div className="w-32 text-muted-foreground">
                {formatDate(doc.createdAt.toString())}
              </div>
              <div className="w-20">
                {doc.isProcessed ? (
                  <Badge variant="default">Ready</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`button-document-menu-${doc.id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleRename(doc)}
                    data-testid={`menu-item-rename-${doc.id}`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onMoveDocument(doc)}
                    data-testid={`menu-item-move-${doc.id}`}
                  >
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteDocument(doc)}
                    data-testid={`menu-item-delete-${doc.id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for the document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Document Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                data-testid="input-rename-document"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              data-testid="button-cancel-rename"
            >
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} data-testid="button-confirm-rename">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

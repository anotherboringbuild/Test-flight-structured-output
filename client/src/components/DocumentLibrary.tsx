import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DocumentCard } from "./DocumentCard";
import { DocumentUploadZone } from "./DocumentUploadZone";

interface Document {
  id: string;
  name: string;
  fileType: "docx" | "pdf" | "pages";
  size: string;
  date: string;
  isProcessed: boolean;
}

interface DocumentLibraryProps {
  documents: Document[];
  onUpload: (files: File[]) => void;
  onView: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DocumentLibrary({
  documents,
  onUpload,
  onView,
  onExport,
  onDelete,
}: DocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">All Documents</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <DocumentUploadZone onFilesSelected={onUpload} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              {...doc}
              onView={onView}
              onExport={onExport}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="pt-6">
          <DocumentUploadZone onFilesSelected={onUpload} />
        </div>
      )}
    </div>
  );
}

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Folder {
  id: string;
  name: string;
}

interface DocumentUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  folders?: Folder[];
  selectedFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
  selectedMonth?: string | null;
  onMonthChange?: (month: string | null) => void;
  selectedYear?: string | null;
  onYearChange?: (year: string | null) => void;
}

export function DocumentUploadZone({
  onFilesSelected,
  disabled = false,
  folders = [],
  selectedFolderId = null,
  onFolderChange,
  selectedMonth = null,
  onMonthChange,
  selectedYear = null,
  onYearChange,
}: DocumentUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      console.log("onDrop called - accepted:", acceptedFiles.length, "rejected:", rejectedFiles.length);
      if (rejectedFiles.length > 0) {
        console.log("Rejected files:", rejectedFiles);
      }
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "application/vnd.apple.pages": [".pages"],
    },
    disabled,
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {folders.length > 0 && onFolderChange && (
          <div>
            <Label htmlFor="upload-folder-select" className="mb-2 block">
              Folder (Optional)
            </Label>
            <Select
              value={selectedFolderId || "none"}
              onValueChange={(value) =>
                onFolderChange(value === "none" ? null : value)
              }
            >
              <SelectTrigger
                id="upload-folder-select"
                data-testid="select-upload-folder"
              >
                <SelectValue placeholder="Select folder..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" data-testid="option-upload-no-folder">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    No Folder
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem
                    key={folder.id}
                    value={folder.id}
                    data-testid={`option-upload-folder-${folder.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {onMonthChange && (
          <div>
            <Label htmlFor="upload-month-select" className="mb-2 block">
              Month (Optional)
            </Label>
            <Select
              value={selectedMonth || "none"}
              onValueChange={(value) =>
                onMonthChange(value === "none" ? null : value)
              }
            >
              <SelectTrigger
                id="upload-month-select"
                data-testid="select-upload-month"
              >
                <SelectValue placeholder="Select month..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" data-testid="option-upload-no-month">
                  No Month
                </SelectItem>
                {months.map((month) => (
                  <SelectItem
                    key={month}
                    value={month}
                    data-testid={`option-upload-month-${month.toLowerCase()}`}
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {onYearChange && (
          <div>
            <Label htmlFor="upload-year-input" className="mb-2 block">
              Year (Optional)
            </Label>
            <Input
              id="upload-year-input"
              type="text"
              placeholder="e.g. 2024"
              value={selectedYear || ""}
              onChange={(e) => onYearChange(e.target.value || null)}
              maxLength={4}
              data-testid="input-upload-year"
            />
          </div>
        )}
      </div>
      <div
        {...getRootProps()}
        className={cn(
          "min-h-96 rounded-2xl border-2 border-dashed transition-colors",
          isDragActive && "border-primary bg-primary/5",
          !isDragActive && "border-border hover-elevate",
          disabled && "cursor-not-allowed opacity-50"
        )}
        data-testid="dropzone-upload"
      >
        <input {...getInputProps()} data-testid="input-file" />
        <div className="flex h-full min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-muted p-6">
            <Upload className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {isDragActive ? "Drop files here" : "Upload Documents"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your files or click to browse
            </p>
          </div>
          <Button
            variant="outline"
            disabled={disabled}
            data-testid="button-browse"
          >
            <FileText className="mr-2 h-4 w-4" />
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground">
            Supports: Word (.docx), PDF (.pdf), Pages (.pages)
          </p>
        </div>
      </div>
    </div>
  );
}

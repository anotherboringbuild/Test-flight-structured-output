import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, FolderOpen, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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

export type UploadMode = "single" | "set";

export interface DocumentSetUpload {
  mode: "set";
  files: File[];
  folderName: string;
  folderDescription?: string;
  originalIndex: number;
  folderId?: string | null;
  month?: string | null;
  year?: string | null;
}

export interface SingleDocumentUpload {
  mode: "single";
  files: File[];
  folderId?: string | null;
  month?: string | null;
  year?: string | null;
}

export type UploadData = DocumentSetUpload | SingleDocumentUpload;

interface DocumentUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onUploadReady?: (data: UploadData) => void;
  disabled?: boolean;
  folders?: Folder[];
  selectedFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
  selectedMonth?: string | null;
  onMonthChange?: (month: string | null) => void;
  selectedYear?: string | null;
  onYearChange?: (year: string | null) => void;
}

export function DocumentUploadZoneOld({
  onFilesSelected,
  onUploadReady,
  disabled = false,
  folders = [],
  selectedFolderId = null,
  onFolderChange,
  selectedMonth = null,
  onMonthChange,
  selectedYear = null,
  onYearChange,
}: DocumentUploadZoneProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [originalIndex, setOriginalIndex] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      console.log("onDrop called - accepted:", acceptedFiles.length, "rejected:", rejectedFiles.length);
      if (rejectedFiles.length > 0) {
        console.log("Rejected files:", rejectedFiles);
      }
      
      if (uploadMode === "single") {
        // For single mode, use existing behavior
        onFilesSelected(acceptedFiles);
      } else {
        // For document set mode, store files for later processing
        setSelectedFiles(acceptedFiles);
        if (acceptedFiles.length > 0 && !folderName) {
          // Auto-suggest folder name from first file
          const fileName = acceptedFiles[0].name.replace(/\.(docx|pdf|pages)$/i, '');
          setFolderName(fileName);
        }
      }
    },
    [onFilesSelected, uploadMode, folderName]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "application/vnd.apple.pages": [".pages"],
    },
    disabled,
    multiple: uploadMode === "set",
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (originalIndex >= newFiles.length && newFiles.length > 0) {
      setOriginalIndex(newFiles.length - 1);
    }
  };

  const handleUploadSet = () => {
    if (!onUploadReady) return;
    
    if (uploadMode === "set") {
      if (!folderName.trim()) {
        return;
      }
      if (selectedFiles.length === 0) {
        return;
      }
      
      const uploadData: DocumentSetUpload = {
        mode: "set",
        files: selectedFiles,
        folderName: folderName.trim(),
        folderDescription: folderDescription.trim() || undefined,
        originalIndex,
        folderId: selectedFolderId,
        month: selectedMonth,
        year: selectedYear,
      };
      onUploadReady(uploadData);
      
      // Reset form
      setSelectedFiles([]);
      setFolderName("");
      setFolderDescription("");
      setOriginalIndex(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Selection */}
      <div className="space-y-2">
        <Label>Upload Type</Label>
        <RadioGroup
          value={uploadMode}
          onValueChange={(value) => {
            setUploadMode(value as UploadMode);
            setSelectedFiles([]);
            setFolderName("");
            setFolderDescription("");
          }}
          className="flex gap-4"
          data-testid="radio-upload-mode"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="mode-single" data-testid="radio-mode-single" />
            <Label htmlFor="mode-single" className="font-normal cursor-pointer">
              Single Document
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="set" id="mode-set" data-testid="radio-mode-set" />
            <Label htmlFor="mode-set" className="font-normal cursor-pointer">
              Document Set (Multiple Languages)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Metadata Fields */}
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

      {/* Folder Name and Description */}
      {uploadMode === "set" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input
              id="folder-name"
              type="text"
              placeholder="e.g. iPhone 17 Pro Marketing Copy"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              data-testid="input-folder-name"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="folder-description">Description (Optional)</Label>
            <Textarea
              id="folder-description"
              placeholder="Describe this folder..."
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              data-testid="textarea-folder-description"
              className="mt-2"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* File Upload Zone */}
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
              {isDragActive ? "Drop files here" : uploadMode === "set" ? "Upload Document Set" : "Upload Documents"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {uploadMode === "set" 
                ? "Upload multiple language variants of the same document"
                : "Drag and drop your files or click to browse"}
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

      {/* Selected Files for Document Set */}
      {uploadMode === "set" && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files ({selectedFiles.length})</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border p-3",
                  index === originalIndex && "border-primary bg-primary/5"
                )}
                data-testid={`file-item-${index}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {index === originalIndex && (
                    <Star className="h-4 w-4 text-primary flex-shrink-0" data-testid={`star-${index}`} />
                  )}
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {index !== originalIndex && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setOriginalIndex(index)}
                      data-testid={`button-mark-original-${index}`}
                    >
                      Mark as Original
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUploadSet}
            disabled={!folderName.trim() || selectedFiles.length === 0 || disabled}
            className="w-full"
            data-testid="button-upload-set"
          >
            Upload to Folder
          </Button>
        </div>
      )}
    </div>
  );
}

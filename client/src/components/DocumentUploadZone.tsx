import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DocumentUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DocumentUploadZone({
  onFilesSelected,
  disabled = false,
}: DocumentUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
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

  return (
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
          onClick={(e) => e.stopPropagation()}
        >
          <FileText className="mr-2 h-4 w-4" />
          Choose Files
        </Button>
        <p className="text-xs text-muted-foreground">
          Supports: Word (.docx), PDF (.pdf), Pages (.pages)
        </p>
      </div>
    </div>
  );
}

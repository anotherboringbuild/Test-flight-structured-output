import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Star, Send, FolderOpen, Calendar, Database, Check, ChevronsUpDown, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UploadMode, UploadData, DocumentSetUpload } from "./DocumentUploadZone";

interface Folder {
  id: string;
  name: string;
  parentFolderId?: string | null;
}

interface DocumentUploadChatProps {
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
  onCreateFolder?: (folderName: string) => Promise<string | null>;
}

export function DocumentUploadChat({
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
  onCreateFolder,
}: DocumentUploadChatProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState("");
  const [originalIndex, setOriginalIndex] = useState(0);
  const [addToAVA, setAddToAVA] = useState(true);
  const [openFolderCombo, setOpenFolderCombo] = useState(false);
  const [folderSearchValue, setFolderSearchValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle closing the folder combobox - clear search value
  const handleCloseFolderCombo = (open: boolean) => {
    if (!open) {
      setFolderSearchValue("");
    }
    setOpenFolderCombo(open);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // For both modes, collect files and wait for manual submission
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
      if (acceptedFiles.length > 0 && uploadMode === "set" && !folderName) {
        const fileName = acceptedFiles[0].name.replace(/\.(docx|pdf|pages)$/i, '');
        setFolderName(fileName);
      }
    },
    [uploadMode, folderName]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "application/vnd.apple.pages": [".pages"],
    },
    disabled,
    multiple: uploadMode === "set",
    noClick: true,
    noKeyboard: true,
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

  const handleBrowseClick = () => {
    open();
  };

  const handleUploadSingle = () => {
    if (!onUploadReady || selectedFiles.length === 0) return;
    
    onUploadReady({
      mode: "single",
      files: selectedFiles,
      folderId: selectedFolderId,
      month: selectedMonth,
      year: selectedYear,
      addToAVA,
    });
    
    setSelectedFiles([]);
  };

  const handleUploadSet = () => {
    if (!onUploadReady) return;
    
    if (uploadMode === "set") {
      if (!folderName.trim() || selectedFiles.length === 0) return;
      
      const uploadData: DocumentSetUpload = {
        mode: "set",
        files: selectedFiles,
        folderName: folderName.trim(),
        folderDescription: undefined,
        originalIndex,
        folderId: selectedFolderId,
        month: selectedMonth,
        year: selectedYear,
        addToAVA,
      };
      onUploadReady(uploadData);
      
      setSelectedFiles([]);
      setFolderName("");
      setOriginalIndex(0);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-8" {...getRootProps()}>
      <input {...getInputProps()} data-testid="input-file" />
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          Hello,
        </h1>
        <div className="flex items-center justify-center gap-3 text-3xl font-semibold">
          <span>Help me extract a</span>
          <Select value={uploadMode} onValueChange={(value) => setUploadMode(value as UploadMode)}>
            <SelectTrigger className="w-auto text-3xl font-semibold border-0 shadow-none h-auto p-0 gap-2 focus:ring-0 [&_span]:bg-gradient-to-r [&_span]:from-blue-600 [&_span]:to-purple-600 [&_span]:bg-clip-text [&_span]:text-transparent" data-testid="select-upload-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single" data-testid="option-single">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                  Single document
                </span>
              </SelectItem>
              <SelectItem value="set" data-testid="option-set">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                  Document set
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Configuration Options */}
      <div 
        className={cn(
          "w-full max-w-3xl rounded-2xl border bg-card p-6 mb-6 space-y-4 transition-colors",
          isDragActive && "border-primary bg-primary/5 border-2"
        )}
      >
        {/* Prompt style configuration */}
        <div className="flex flex-wrap items-center gap-3 text-base">
          <span className="text-muted-foreground">Based on</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBrowseClick}
            disabled={disabled}
            data-testid="button-upload-file"
            className="h-9 pointer-events-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          
          {selectedFiles.length > 0 && (
            <Badge variant="outline" className="h-9 px-3">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-base">
          <span className="text-muted-foreground">{uploadMode === "set" ? "Create or select folder" : "Organize with"}</span>
          
          {onFolderChange && (
            <Popover open={openFolderCombo} onOpenChange={handleCloseFolderCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openFolderCombo}
                  className="w-64 h-9 justify-between"
                  data-testid="button-folder-combobox"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FolderOpen className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {uploadMode === "set" && folderName 
                        ? folderName
                        : selectedFolderId
                        ? folders.find((f) => f.id === selectedFolderId)?.name
                        : "No Folder"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <Command>
                  <CommandInput 
                    placeholder={uploadMode === "set" ? "Type to create or search..." : "Search folders..."} 
                    value={folderSearchValue}
                    onValueChange={setFolderSearchValue}
                    data-testid="input-folder-search"
                  />
                  <CommandList>
                    <CommandEmpty>No folders found.</CommandEmpty>
                    <CommandGroup>
                      {folderSearchValue && !folders.some(f => f.name.toLowerCase() === folderSearchValue.toLowerCase()) && (
                        <CommandItem
                          value={`__create__${folderSearchValue}`}
                          onSelect={async () => {
                            const newFolderName = folderSearchValue.trim();
                            if (uploadMode === "set") {
                              // For document set, just set the folder name
                              setFolderName(newFolderName);
                              onFolderChange(null);
                            } else if (onCreateFolder) {
                              // For single document, create the folder via API
                              const newFolderId = await onCreateFolder(newFolderName);
                              if (newFolderId) {
                                onFolderChange(newFolderId);
                              }
                            }
                            setFolderSearchValue("");
                            setOpenFolderCombo(false);
                          }}
                          data-testid="option-create-folder"
                        >
                          <FolderPlus className="mr-2 h-4 w-4 text-primary" />
                          <span>Create folder <span className="font-semibold">"{folderSearchValue}"</span></span>
                        </CommandItem>
                      )}
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setFolderName("");
                          onFolderChange(null);
                          setFolderSearchValue("");
                          setOpenFolderCombo(false);
                        }}
                        data-testid="option-no-folder"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (!selectedFolderId && !folderName) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        No Folder
                      </CommandItem>
                      {(() => {
                        // Build hierarchical folder structure
                        const getRenderableFolders = () => {
                          const result: (typeof folders[0] & { level: number })[] = [];
                          
                          const addFolder = (folder: typeof folders[0], level: number) => {
                            result.push({ ...folder, level });
                            const children = folders.filter(f => f.parentFolderId === folder.id);
                            children.forEach(child => addFolder(child, level + 1));
                          };
                          
                          folders
                            .filter(f => !f.parentFolderId)
                            .forEach(folder => addFolder(folder, 0));
                          
                          return result;
                        };
                        
                        return getRenderableFolders().map((folder) => (
                          <CommandItem
                            key={folder.id}
                            value={folder.name}
                            onSelect={() => {
                              if (uploadMode === "set") {
                                setFolderName(folder.name);
                                onFolderChange(folder.id);
                              } else {
                                onFolderChange(folder.id);
                              }
                              setFolderSearchValue("");
                              setOpenFolderCombo(false);
                            }}
                            data-testid={`option-folder-${folder.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                (uploadMode === "set" ? folderName === folder.name : selectedFolderId === folder.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span style={{ marginLeft: `${folder.level * 12}px` }}>
                              {folder.name}
                            </span>
                          </CommandItem>
                        ));
                      })()}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {onMonthChange && (
            <>
              <span className="text-muted-foreground">~</span>
              <Select value={selectedMonth || "none"} onValueChange={(value) => onMonthChange(value === "none" ? null : value)}>
                <SelectTrigger className="w-auto h-9" data-testid="select-month-chat">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Month</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {onYearChange && (
            <Input
              type="text"
              placeholder="Year"
              value={selectedYear || ""}
              onChange={(e) => onYearChange(e.target.value || null)}
              maxLength={4}
              className="w-24 h-9"
              data-testid="input-year-chat"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-base">
          <span className="text-muted-foreground">&</span>
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-background">
            <Switch
              id="ava-toggle"
              checked={addToAVA}
              onCheckedChange={setAddToAVA}
              data-testid="switch-ava-knowledge"
            />
            <Label htmlFor="ava-toggle" className="cursor-pointer flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Add to AVA knowledge base</span>
            </Label>
          </div>
        </div>

        {isDragActive && (
          <div className="py-8 text-center border-2 border-dashed border-primary rounded-lg bg-primary/5">
            <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-semibold text-primary">Drop files here</p>
          </div>
        )}
      </div>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="w-full max-w-3xl mb-6 space-y-2">
          <Label className="text-sm text-muted-foreground">Selected Files</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border p-3 bg-card",
                  uploadMode === "set" && index === originalIndex && "border-primary bg-primary/5"
                )}
                data-testid={`file-item-${index}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {uploadMode === "set" && index === originalIndex && (
                    <Star className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {uploadMode === "set" && index !== originalIndex && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setOriginalIndex(index)}
                      className="h-7 text-xs"
                      data-testid={`button-mark-original-${index}`}
                    >
                      Mark Original
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveFile(index)}
                    className="h-7 w-7"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-center">
          {uploadMode === "single" ? (
            <Button
              onClick={handleUploadSingle}
              disabled={selectedFiles.length === 0 || disabled}
              size="icon"
              className="rounded-full h-16 w-16"
              data-testid="button-upload-single-chat"
            >
              <Send className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              onClick={handleUploadSet}
              disabled={!folderName.trim() || selectedFiles.length === 0 || disabled}
              size="lg"
              className="rounded-full px-8"
              data-testid="button-upload-set-chat"
            >
              <Send className="mr-2 h-5 w-5" />
              Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* File Format Hint and Submission Info */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-sm text-muted-foreground">
          Supports: Word (.docx), PDF (.pdf), Pages (.pages) • Drag and drop or click "Upload Document" to begin
        </p>
        {selectedFiles.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Configure your upload above, then click the button below to submit
          </p>
        )}
      </div>
    </div>
  );
}

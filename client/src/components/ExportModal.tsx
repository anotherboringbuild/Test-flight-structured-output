import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string, filename: string) => void;
  documentName: string;
  jsonData: string;
}

export function ExportModal({
  open,
  onClose,
  onExport,
  documentName,
  jsonData,
}: ExportModalProps) {
  const [format, setFormat] = useState("json");
  const [filename, setFilename] = useState(documentName.replace(/\.[^/.]+$/, ""));

  const handleExport = () => {
    onExport(format, filename);
    onClose();
  };

  const getFileExtension = () => {
    switch (format) {
      case "json":
        return ".json";
      case "csv":
        return ".csv";
      case "txt":
        return ".txt";
      default:
        return ".json";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-export">
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Choose the format and filename for your export.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" data-testid="radio-json" />
                <Label htmlFor="json" className="font-normal cursor-pointer">
                  JSON - Structured data format
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" data-testid="radio-csv" />
                <Label htmlFor="csv" className="font-normal cursor-pointer">
                  CSV - Comma-separated values
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" data-testid="radio-txt" />
                <Label htmlFor="txt" className="font-normal cursor-pointer">
                  TXT - Plain text
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                data-testid="input-filename"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {getFileExtension()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <ScrollArea className="h-48 rounded-lg border bg-muted/30 p-4">
              <pre className="text-xs font-mono" data-testid="text-preview">
                {jsonData}
              </pre>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-export"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!filename.trim()}
            data-testid="button-confirm-export"
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

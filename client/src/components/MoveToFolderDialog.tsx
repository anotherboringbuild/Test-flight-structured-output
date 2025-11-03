import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Folder {
  id: string;
  name: string;
}

interface MoveToFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (folderId: string | null) => void;
  folders: Folder[];
  currentFolderId?: string | null;
  documentName: string;
}

export function MoveToFolderDialog({
  open,
  onClose,
  onSubmit,
  folders,
  currentFolderId,
  documentName,
}: MoveToFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    currentFolderId || null
  );

  useEffect(() => {
    setSelectedFolderId(currentFolderId || null);
  }, [currentFolderId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedFolderId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-move-to-folder">
        <DialogHeader>
          <DialogTitle>Move Document</DialogTitle>
          <DialogDescription>
            Move "{documentName}" to a folder or remove from current folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-select">Destination Folder</Label>
              <Select
                value={selectedFolderId || "none"}
                onValueChange={(value) =>
                  setSelectedFolderId(value === "none" ? null : value)
                }
              >
                <SelectTrigger
                  id="folder-select"
                  data-testid="select-folder"
                >
                  <SelectValue placeholder="Select a folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" data-testid="option-no-folder">
                    No Folder (Root)
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem
                      key={folder.id}
                      value={folder.id}
                      data-testid={`option-folder-${folder.id}`}
                    >
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-move"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-move">
              Move Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

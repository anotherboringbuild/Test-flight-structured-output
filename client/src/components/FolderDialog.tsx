import { useState, useEffect } from "react";
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
  parentFolderId?: string | null;
}

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string, parentFolderId?: string | null) => void;
  initialName?: string;
  initialDescription?: string;
  initialParentFolderId?: string | null;
  mode: "create" | "edit";
  folders?: Folder[];
}

export function FolderDialog({
  open,
  onClose,
  onSubmit,
  initialName = "",
  initialDescription = "",
  initialParentFolderId = null,
  mode,
  folders = [],
}: FolderDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [parentFolderId, setParentFolderId] = useState<string | null>(initialParentFolderId);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setParentFolderId(initialParentFolderId);
  }, [initialName, initialDescription, initialParentFolderId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim() || undefined, parentFolderId);
      setName("");
      setDescription("");
      setParentFolderId(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-folder">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Folder" : "Rename Folder"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Enter a name for your new folder to organize your documents."
              : "Enter a new name for this folder."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                data-testid="input-folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name..."
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Textarea
                id="folder-description"
                data-testid="textarea-folder-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for document variant sets..."
                rows={2}
              />
            </div>
            {mode === "create" && folders.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                <Select value={parentFolderId || ""} onValueChange={(value) => setParentFolderId(value || null)}>
                  <SelectTrigger id="parent-folder" data-testid="select-parent-folder">
                    <SelectValue placeholder="No parent folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-folder"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              data-testid="button-submit-folder"
            >
              {mode === "create" ? "Create Folder" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
  documentCount: number;
}

export function DeleteFolderDialog({
  open,
  onClose,
  onConfirm,
  folderName,
  documentCount,
}: DeleteFolderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent data-testid="dialog-delete-folder">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{folderName}"?
            {documentCount > 0 && (
              <>
                {" "}
                This folder contains {documentCount} document
                {documentCount !== 1 ? "s" : ""}. The documents will be moved
                to the root level and will not be deleted.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete-folder">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid="button-confirm-delete-folder"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Folder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

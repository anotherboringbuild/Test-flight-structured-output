import { FileText, MoreVertical, Download, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DocumentCardProps {
  id: string;
  name: string;
  fileType: "docx" | "pdf" | "pages";
  size: string;
  date: string;
  isProcessed: boolean;
  onView: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DocumentCard({
  id,
  name,
  fileType,
  size,
  date,
  isProcessed,
  onView,
  onExport,
  onDelete,
}: DocumentCardProps) {
  const fileTypeColors = {
    docx: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    pdf: "bg-red-500/10 text-red-600 dark:text-red-400",
    pages: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };

  return (
    <Card className="group hover-elevate" data-testid={`card-document-${id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`rounded-lg p-3 ${fileTypeColors[fileType]}`}>
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold truncate" data-testid={`text-document-name-${id}`}>
                {name}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid={`button-menu-${id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(id)} data-testid={`button-view-${id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onExport(id)}
                    disabled={!isProcessed}
                    data-testid={`button-export-${id}`}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-destructive"
                    data-testid={`button-delete-${id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{size}</span>
              <span>•</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-3">
        <div className="flex items-center justify-between w-full">
          <Badge
            variant={isProcessed ? "default" : "secondary"}
            className="text-xs"
            data-testid={`badge-status-${id}`}
          >
            {isProcessed ? "Processed" : "Pending"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-quick-view-${id}`}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

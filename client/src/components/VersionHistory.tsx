import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Clock, RotateCcw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistance } from "date-fns";

interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  extractedText: string | null;
  structuredData: any;
  validationConfidence: number | null;
  validationIssues: string[] | null;
  changeDescription: string | null;
  createdAt: string;
}

interface VersionHistoryProps {
  documentId: string;
  currentVersion?: {
    structuredData: any;
    validationConfidence: number | null;
    updatedAt: string;
  };
  onVersionRestored?: () => void;
}

export function VersionHistory({ documentId, currentVersion, onVersionRestored }: VersionHistoryProps) {
  const { toast } = useToast();
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const { data: versions = [], isLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents", documentId, "versions"],
    enabled: !!documentId,
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return await apiRequest(`/api/documents/${documentId}/restore-version`, {
        method: "POST",
        body: JSON.stringify({ versionId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId, "versions"] });
      toast({
        title: "Version Restored",
        description: "The document has been reverted to the selected version.",
      });
      onVersionRestored?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore version",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading version history...
      </div>
    );
  }

  const hasVersions = versions.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="font-semibold">Version History</h3>
          <Badge variant="secondary" data-testid="badge-version-count">
            {hasVersions ? versions.length : 0} {hasVersions && versions.length === 1 ? "version" : "versions"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Track changes and restore previous versions
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Current version */}
          {currentVersion && (
            <Card className="p-3 border-primary/50" data-testid="card-current-version">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                    {currentVersion.validationConfidence !== null && (
                      <Badge 
                        variant={currentVersion.validationConfidence >= 0.8 ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {Math.round(currentVersion.validationConfidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated {formatDistance(new Date(currentVersion.updatedAt), new Date(), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Previous versions */}
          {versions.map((version) => (
            <Card 
              key={version.id} 
              className="p-3 hover-elevate transition-colors cursor-pointer" 
              data-testid={`card-version-${version.id}`}
              onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="shrink-0">
                      Version {version.versionNumber}
                    </Badge>
                    {version.validationConfidence !== null && (
                      <Badge 
                        variant={version.validationConfidence >= 0.8 ? "secondary" : "outline"}
                        className="shrink-0"
                      >
                        {Math.round(version.validationConfidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  {version.changeDescription && (
                    <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                      {version.changeDescription}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistance(new Date(version.createdAt), new Date(), { addSuffix: true })}
                  </p>
                  
                  {expandedVersion === version.id && version.validationIssues && version.validationIssues.length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded-sm">
                      <p className="text-xs font-medium mb-1">Validation Issues:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {version.validationIssues.slice(0, 3).map((issue, idx) => (
                          <li key={idx} className="line-clamp-1">• {issue}</li>
                        ))}
                        {version.validationIssues.length > 3 && (
                          <li>• ... and {version.validationIssues.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreMutation.mutate(version.id);
                  }}
                  disabled={restoreMutation.isPending}
                  data-testid={`button-restore-version-${version.id}`}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              </div>
            </Card>
          ))}

          {!hasVersions && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No version history yet</p>
              <p className="text-xs mt-1">
                Versions are created when you reprocess this document
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

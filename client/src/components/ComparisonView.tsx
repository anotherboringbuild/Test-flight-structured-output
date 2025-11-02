import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Download, Edit, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";

interface ComparisonViewProps {
  documentName: string;
  extractedText: string;
  structuredData: string;
  isProcessing?: boolean;
  onBack: () => void;
  onExport: () => void;
  onSave?: (newData: string) => void;
}

export function ComparisonView({
  documentName,
  extractedText,
  structuredData,
  isProcessing = false,
  onBack,
  onExport,
  onSave,
}: ComparisonViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(structuredData);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(editedData);
    toast({
      title: "Copied to clipboard",
      description: "JSON data has been copied to your clipboard.",
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedData);
      setIsEditing(false);
      toast({
        title: "Changes saved",
        description: "Your modifications have been saved successfully.",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-document-title">
                {documentName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Document to JSON extraction
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Badge variant="secondary" className="gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </Badge>
            ) : isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData(structuredData);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} data-testid="button-save">
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  data-testid="button-copy"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={onExport} data-testid="button-export-comparison">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="border-r">
          <div className="border-b bg-muted/30 px-6 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Original Document</h3>
              <Badge variant="secondary">Extracted Text</Badge>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" data-testid="text-extracted">
                {extractedText}
              </pre>
            </div>
          </ScrollArea>
        </div>

        <div>
          <div className="border-b bg-muted/30 px-6 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Product JSON Output</h3>
              <Badge variant="default">Structured</Badge>
            </div>
          </div>
          <div className="h-[calc(100vh-12rem)]">
            {isEditing ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                value={editedData}
                onChange={(value) => setEditedData(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
              />
            ) : (
              <ScrollArea className="h-full">
                <pre className="p-6 font-mono text-xs leading-relaxed" data-testid="text-structured">
                  {editedData}
                </pre>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

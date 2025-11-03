import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Download, Edit, Loader2, RefreshCw, Languages } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";

interface ComparisonViewProps {
  documentName: string;
  extractedText: string;
  translatedText?: string | null;
  structuredData: string;
  isProcessing?: boolean;
  isTranslating?: boolean;
  onBack: () => void;
  onExport: () => void;
  onSave?: (newData: string) => void;
  onReprocess?: () => void;
  onTranslate?: () => void;
}

interface TextSegment {
  text: string;
  start: number;
  end: number;
  field?: string;
}

export function ComparisonView({
  documentName,
  extractedText,
  translatedText,
  structuredData,
  isProcessing = false,
  isTranslating = false,
  onBack,
  onExport,
  onSave,
  onReprocess,
  onTranslate,
}: ComparisonViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(structuredData);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();

  // Auto-enable translation toggle when translation becomes available
  useEffect(() => {
    if (translatedText && !isTranslating) {
      setShowTranslation(true);
    }
  }, [translatedText, isTranslating]);

  // Determine which text to display
  const displayText = showTranslation && translatedText ? translatedText : extractedText;

  // Parse JSON and create text segments with field mappings
  const { jsonSegments, textSegments } = useMemo(() => {
    try {
      const parsed = JSON.parse(editedData);
      const jsonSegs: TextSegment[] = [];
      const textSegs: TextSegment[] = [];

      // Helper to find text in extracted content
      const findInText = (value: string, fieldName: string) => {
        if (!value || typeof value !== 'string' || value.length < 10) return;
        
        // Clean the value for searching (remove extra whitespace)
        const cleanValue = value.trim().slice(0, 100); // First 100 chars for matching
        const index = displayText.indexOf(cleanValue);
        
        if (index !== -1) {
          textSegs.push({
            text: value,
            start: index,
            end: index + value.length,
            field: fieldName,
          });
        }
      };

      // Extract segments from JSON structure
      if (Array.isArray(parsed.Headlines)) {
        parsed.Headlines.forEach((headline: string, idx: number) => {
          findInText(headline, `Headline-${idx}`);
        });
      }

      if (parsed.AdvertisingCopy) {
        findInText(parsed.AdvertisingCopy, 'AdvertisingCopy');
      }

      if (Array.isArray(parsed.KeyFeatureBullets)) {
        parsed.KeyFeatureBullets.forEach((bullet: string, idx: number) => {
          findInText(bullet, `KeyFeatureBullet-${idx}`);
        });
      }

      if (Array.isArray(parsed.LegalReferences)) {
        parsed.LegalReferences.forEach((legal: string, idx: number) => {
          findInText(legal, `LegalReference-${idx}`);
        });
      }

      return { jsonSegments: jsonSegs, textSegments: textSegs };
    } catch (e) {
      return { jsonSegments: [], textSegments: [] };
    }
  }, [editedData, displayText]);

  // Create highlighted text with hover regions
  const renderHighlightedText = () => {
    if (textSegments.length === 0) {
      return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{displayText}</pre>;
    }

    // Sort segments by start position
    const sorted = [...textSegments].sort((a, b) => a.start - b.start);
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sorted.forEach((segment, idx) => {
      // Add text before this segment
      if (segment.start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {displayText.slice(lastIndex, segment.start)}
          </span>
        );
      }

      // Add highlighted segment
      const isHovered = hoveredField === segment.field;
      elements.push(
        <mark
          key={`mark-${idx}`}
          data-field={segment.field}
          onMouseEnter={() => setHoveredField(segment.field || null)}
          onMouseLeave={() => setHoveredField(null)}
          className={`cursor-pointer transition-all ${
            isHovered
              ? 'bg-primary/30 font-medium'
              : 'bg-primary/10 hover:bg-primary/20'
          }`}
        >
          {displayText.slice(segment.start, segment.end)}
        </mark>
      );

      lastIndex = segment.end;
    });

    // Add remaining text
    if (lastIndex < displayText.length) {
      elements.push(
        <span key="text-end">{displayText.slice(lastIndex)}</span>
      );
    }

    return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{elements}</pre>;
  };

  // Render JSON with hover regions
  const renderHighlightedJson = () => {
    try {
      const parsed = JSON.parse(editedData);
      const lines = JSON.stringify(parsed, null, 2).split('\n');
      
      return lines.map((line, idx) => {
        let field: string | null = null;
        
        // Detect which field this line belongs to
        if (line.includes('"Headlines"')) field = 'Headlines-header';
        else if (line.includes('"AdvertisingCopy"')) field = 'AdvertisingCopy';
        else if (line.includes('"KeyFeatureBullets"')) field = 'KeyFeatureBullets-header';
        else if (line.includes('"LegalReferences"')) field = 'LegalReferences-header';

        // Check if line is inside a bullets/headlines array
        const headlineMatch = textSegments.find(s => 
          s.field?.startsWith('Headline-') && line.includes(s.text.slice(0, 30))
        );
        const featureBulletMatch = textSegments.find(s => 
          s.field?.startsWith('KeyFeatureBullet-') && line.includes(s.text.slice(0, 30))
        );
        const legalRefMatch = textSegments.find(s => 
          s.field?.startsWith('LegalReference-') && line.includes(s.text.slice(0, 30))
        );
        
        if (headlineMatch) field = headlineMatch.field || null;
        if (featureBulletMatch) field = featureBulletMatch.field || null;
        if (legalRefMatch) field = legalRefMatch.field || null;

        const isHovered = field && hoveredField === field;
        
        return (
          <div
            key={idx}
            data-field={field}
            onMouseEnter={() => field && setHoveredField(field)}
            onMouseLeave={() => setHoveredField(null)}
            className={`transition-all ${
              isHovered
                ? 'bg-primary/30 font-medium'
                : field
                ? 'hover:bg-primary/20 cursor-pointer'
                : ''
            }`}
          >
            {line}
          </div>
        );
      });
    } catch (e) {
      return <pre>{editedData}</pre>;
    }
  };

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
    <div className="absolute inset-0 flex flex-col">
      <div className="border-b bg-background px-6 py-4 flex-shrink-0">
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
                Document to JSON extraction • Hover to highlight matching sections
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
                {onReprocess && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onReprocess}
                    data-testid="button-reprocess"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
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

      <div className="grid flex-1 min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="flex flex-col border-r min-h-0">
          <div className="border-b bg-muted/30 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-medium">Original Document</h3>
              <div className="flex items-center gap-3">
                {onTranslate && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="translation-toggle"
                      checked={showTranslation}
                      onCheckedChange={(checked) => {
                        if (checked && !translatedText) {
                          onTranslate();
                        }
                        setShowTranslation(checked);
                      }}
                      disabled={isTranslating}
                      data-testid="switch-translation"
                    />
                    <Label htmlFor="translation-toggle" className="text-sm cursor-pointer flex items-center gap-1">
                      <Languages className="h-4 w-4" />
                      {isTranslating ? 'Translating...' : 'English'}
                    </Label>
                  </div>
                )}
                <Badge variant="secondary">
                  {showTranslation && translatedText ? 'Translated' : 'Extracted Text'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-6" data-testid="text-extracted">
            {renderHighlightedText()}
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="border-b bg-muted/30 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Product JSON Output</h3>
              <Badge variant="default">Structured</Badge>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
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
                  wordWrap: "off",
                }}
              />
            ) : (
              <div className="h-full overflow-auto p-6" data-testid="text-structured">
                <pre className="font-mono text-xs leading-relaxed">
                  {renderHighlightedJson()}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

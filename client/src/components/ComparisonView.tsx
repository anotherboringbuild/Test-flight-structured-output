import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Copy, Download, Edit, Loader2, RefreshCw, Languages, Search, ChevronUp, ChevronDown, X, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";

interface ComparisonViewProps {
  documentName: string;
  extractedText: string;
  translatedText?: string | null;
  structuredData: string;
  language?: string | null;
  validationConfidence?: number | null;
  validationIssues?: string[] | null;
  needsReview?: boolean;
  isProcessing?: boolean;
  isTranslating?: boolean;
  isValidating?: boolean;
  onBack: () => void;
  onExport: () => void;
  onSave?: (newData: string) => void;
  onReprocess?: () => void;
  onTranslate?: () => void;
  onValidate?: () => void;
}

interface TextSegment {
  text: string;
  start: number;
  end: number;
  field?: string;
}

// Helper: Find all match positions in a string
function findMatches(text: string, query: string): number[] {
  if (!query) return [];
  const matches: number[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    matches.push(index);
    index = lowerText.indexOf(lowerQuery, index + 1);
  }
  return matches;
}

// Helper: Extract products from a section array
function extractProductsFromSection(
  section: any[] | undefined,
  sectionName: string,
  defaultPrefix: string
): Array<{ id: string; name: string; section: string }> {
  if (!Array.isArray(section)) return [];
  
  return section.map((product: any, index: number) => ({
    id: `${sectionName}-${index}`,
    name: product.ProductName || `${defaultPrefix} ${index + 1}`,
    section: sectionName
  }));
}

export function ComparisonView({
  documentName,
  extractedText,
  translatedText,
  structuredData,
  language,
  validationConfidence,
  validationIssues,
  needsReview,
  isProcessing = false,
  isTranslating = false,
  isValidating = false,
  onBack,
  onExport,
  onSave,
  onReprocess,
  onTranslate,
  onValidate,
}: ComparisonViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(structuredData);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const { toast } = useToast();
  
  // Search state
  const [textSearchQuery, setTextSearchQuery] = useState("");
  const [jsonSearchQuery, setJsonSearchQuery] = useState("");
  const [textSearchIndex, setTextSearchIndex] = useState(0);
  const [jsonSearchIndex, setJsonSearchIndex] = useState(0);

  // Auto-enable translation toggle when translation becomes available
  useEffect(() => {
    if (translatedText && !isTranslating) {
      setShowTranslation(true);
    }
  }, [translatedText, isTranslating]);

  // Determine which text to display
  const displayText = showTranslation && translatedText ? translatedText : extractedText;

  // Extract all products from JSON for product selector
  const allProducts = useMemo(() => {
    try {
      const parsed = JSON.parse(editedData);
      return [
        ...extractProductsFromSection(parsed.ProductCopy, "ProductCopy", "Product"),
        ...extractProductsFromSection(parsed.BusinessCopy, "BusinessCopy", "Business Product"),
        ...extractProductsFromSection(parsed.UpgraderCopy, "UpgraderCopy", "Upgrader Product")
      ];
    } catch (e) {
      return [];
    }
  }, [editedData]);

  // Get filtered JSON based on selected product
  const displayedJson = useMemo(() => {
    if (selectedProduct === "all" || isEditing) {
      return editedData;
    }
    
    try {
      const parsed = JSON.parse(editedData);
      const [section, indexStr] = selectedProduct.split("-");
      const index = parseInt(indexStr, 10);
      
      if (section === "ProductCopy" && Array.isArray(parsed.ProductCopy) && parsed.ProductCopy[index]) {
        return JSON.stringify({ ProductCopy: [parsed.ProductCopy[index]] }, null, 2);
      } else if (section === "BusinessCopy" && Array.isArray(parsed.BusinessCopy) && parsed.BusinessCopy[index]) {
        return JSON.stringify({ BusinessCopy: [parsed.BusinessCopy[index]] }, null, 2);
      } else if (section === "UpgraderCopy" && Array.isArray(parsed.UpgraderCopy) && parsed.UpgraderCopy[index]) {
        return JSON.stringify({ UpgraderCopy: [parsed.UpgraderCopy[index]] }, null, 2);
      }
      
      return editedData;
    } catch (e) {
      return editedData;
    }
  }, [editedData, selectedProduct, isEditing]);

  // Find all matches in text
  const textMatches = useMemo(() => 
    findMatches(displayText, textSearchQuery),
    [textSearchQuery, displayText]
  );

  // Find all matches in JSON
  const jsonMatches = useMemo(() => {
    try {
      const formattedJson = JSON.stringify(JSON.parse(displayedJson), null, 2);
      return findMatches(formattedJson, jsonSearchQuery);
    } catch (e) {
      return [];
    }
  }, [jsonSearchQuery, displayedJson]);

  // Reset search index when query changes
  useEffect(() => {
    setTextSearchIndex(0);
  }, [textSearchQuery]);

  useEffect(() => {
    setJsonSearchIndex(0);
  }, [jsonSearchQuery]);

  // Auto-scroll to current text match
  useEffect(() => {
    if (textMatches.length > 0 && textSearchQuery) {
      const element = document.querySelector(`[data-search-match="${textMatches[textSearchIndex]}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [textSearchIndex, textMatches, textSearchQuery]);

  // Auto-scroll to current JSON match
  useEffect(() => {
    if (jsonMatches.length > 0 && jsonSearchQuery) {
      const element = document.querySelector(`[data-json-search-match="${jsonMatches[jsonSearchIndex]}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [jsonSearchIndex, jsonMatches, jsonSearchQuery]);

  // Search navigation handlers
  const goToNextTextMatch = () => {
    if (textMatches.length > 0) {
      setTextSearchIndex((prev) => (prev + 1) % textMatches.length);
    }
  };

  const goToPrevTextMatch = () => {
    if (textMatches.length > 0) {
      setTextSearchIndex((prev) => (prev - 1 + textMatches.length) % textMatches.length);
    }
  };

  const goToNextJsonMatch = () => {
    if (jsonMatches.length > 0) {
      setJsonSearchIndex((prev) => (prev + 1) % jsonMatches.length);
    }
  };

  const goToPrevJsonMatch = () => {
    if (jsonMatches.length > 0) {
      setJsonSearchIndex((prev) => (prev - 1 + jsonMatches.length) % jsonMatches.length);
    }
  };

  // Parse JSON and create text segments with field mappings
  const { jsonSegments, textSegments } = useMemo(() => {
    try {
      const parsed = JSON.parse(displayedJson);
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

      // Helper to extract segments from a single product
      const extractProductSegments = (product: any, sectionName: string, productIndex: number) => {
        const prefix = `${sectionName}-${productIndex}`;
        
        if (product.ProductName) {
          findInText(product.ProductName, `${prefix}-ProductName`);
        }

        if (Array.isArray(product.Headlines)) {
          product.Headlines.forEach((headline: string, idx: number) => {
            findInText(headline, `${prefix}-Headline-${idx}`);
          });
        }

        if (product.AdvertisingCopy) {
          findInText(product.AdvertisingCopy, `${prefix}-AdvertisingCopy`);
        }

        if (Array.isArray(product.KeyFeatureBullets)) {
          product.KeyFeatureBullets.forEach((bullet: string, idx: number) => {
            findInText(bullet, `${prefix}-KeyFeatureBullet-${idx}`);
          });
        }

        if (Array.isArray(product.LegalReferences)) {
          product.LegalReferences.forEach((legal: string, idx: number) => {
            findInText(legal, `${prefix}-LegalReference-${idx}`);
          });
        }
      };

      // Extract segments from all sections
      const sections = ['ProductCopy', 'BusinessCopy', 'UpgraderCopy'] as const;
      sections.forEach(sectionName => {
        const section = parsed[sectionName];
        if (!section) return;

        // Handle array of products (new format)
        if (Array.isArray(section)) {
          section.forEach((product, productIdx) => {
            extractProductSegments(product, sectionName, productIdx);
          });
        } 
        // Handle legacy single product format
        else {
          extractProductSegments(section, sectionName, 0);
        }
      });

      return { jsonSegments: jsonSegs, textSegments: textSegs };
    } catch (e) {
      return { jsonSegments: [], textSegments: [] };
    }
  }, [displayedJson, displayText]);

  // Helper to render text with search highlights
  const renderTextWithSearch = (text: string, startOffset: number = 0) => {
    if (!textSearchQuery || textMatches.length === 0) {
      return text;
    }

    const elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const query = textSearchQuery.toLowerCase();
    const lowerText = text.toLowerCase();

    // Find matches within this text segment
    let searchIndex = lowerText.indexOf(query);
    while (searchIndex !== -1) {
      const globalIndex = startOffset + searchIndex;
      const matchIndex = textMatches.indexOf(globalIndex);
      const isCurrentMatch = matchIndex === textSearchIndex;

      // Add text before match
      if (searchIndex > lastIndex) {
        elements.push(text.slice(lastIndex, searchIndex));
      }

      // Add highlighted match
      elements.push(
        <mark
          key={`search-${globalIndex}`}
          data-search-match={globalIndex}
          className={`${
            isCurrentMatch
              ? 'bg-amber-400 font-semibold ring-2 ring-amber-500'
              : 'bg-amber-200'
          }`}
        >
          {text.slice(searchIndex, searchIndex + textSearchQuery.length)}
        </mark>
      );

      lastIndex = searchIndex + textSearchQuery.length;
      searchIndex = lowerText.indexOf(query, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return <>{elements}</>;
  };

  // Create highlighted text with hover regions and search highlights
  const renderHighlightedText = () => {
    if (textSegments.length === 0) {
      return (
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {renderTextWithSearch(displayText, 0)}
        </pre>
      );
    }

    // Sort segments by start position
    const sorted = [...textSegments].sort((a, b) => a.start - b.start);
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sorted.forEach((segment, idx) => {
      // Add text before this segment with search highlighting
      if (segment.start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {renderTextWithSearch(displayText.slice(lastIndex, segment.start), lastIndex)}
          </span>
        );
      }

      // Add highlighted segment with search highlighting
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
          {renderTextWithSearch(displayText.slice(segment.start, segment.end), segment.start)}
        </mark>
      );

      lastIndex = segment.end;
    });

    // Add remaining text with search highlighting
    if (lastIndex < displayText.length) {
      elements.push(
        <span key="text-end">
          {renderTextWithSearch(displayText.slice(lastIndex), lastIndex)}
        </span>
      );
    }

    return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{elements}</pre>;
  };

  // Helper to render JSON line with search highlights
  const renderJsonLineWithSearch = (line: string, lineStartIndex: number) => {
    if (!jsonSearchQuery || jsonMatches.length === 0) {
      return line;
    }

    const elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const query = jsonSearchQuery.toLowerCase();
    const lowerLine = line.toLowerCase();

    // Find matches within this line
    let searchIndex = lowerLine.indexOf(query);
    while (searchIndex !== -1) {
      const globalIndex = lineStartIndex + searchIndex;
      const matchIndex = jsonMatches.indexOf(globalIndex);
      const isCurrentMatch = matchIndex === jsonSearchIndex;

      // Add text before match
      if (searchIndex > lastIndex) {
        elements.push(line.slice(lastIndex, searchIndex));
      }

      // Add highlighted match
      elements.push(
        <mark
          key={`json-search-${globalIndex}`}
          data-json-search-match={globalIndex}
          className={`${
            isCurrentMatch
              ? 'bg-amber-400 font-semibold ring-2 ring-amber-500'
              : 'bg-amber-200'
          }`}
        >
          {line.slice(searchIndex, searchIndex + jsonSearchQuery.length)}
        </mark>
      );

      lastIndex = searchIndex + jsonSearchQuery.length;
      searchIndex = lowerLine.indexOf(query, lastIndex);
    }

    // Add remaining text
    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }

    return <>{elements}</>;
  };

  // Render JSON with hover regions and search highlights
  const renderHighlightedJson = () => {
    try {
      const parsed = JSON.parse(displayedJson);
      const formattedJson = JSON.stringify(parsed, null, 2);
      const lines = formattedJson.split('\n');
      let charIndex = 0;
      
      return lines.map((line, idx) => {
        const lineStartIndex = charIndex;
        charIndex += line.length + 1; // +1 for newline
        
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
            {renderJsonLineWithSearch(line, lineStartIndex)}
          </div>
        );
      });
    } catch (e) {
      return <pre>{displayedJson}</pre>;
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
              {allProducts.length > 1 && !isEditing && (
                <div className="mt-3 flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">View Product:</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-[280px] h-8 text-xs" data-testid="select-product-filter">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products ({allProducts.length})</SelectItem>
                      {allProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.section})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {validationConfidence !== null && validationConfidence !== undefined && !isEditing && (
                <div className="mt-3 flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs font-medium">AI Validation:</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {needsReview ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-500">
                          {Math.round(validationConfidence * 100)}% - Needs Review
                        </span>
                      </>
                    ) : validationConfidence >= 0.8 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-500">
                          {Math.round(validationConfidence * 100)}% - Validated
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {Math.round(validationConfidence * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                  {validationIssues && validationIssues.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {validationIssues.length} {validationIssues.length === 1 ? 'issue' : 'issues'}
                    </Badge>
                  )}
                  {onValidate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onValidate}
                      disabled={isValidating}
                      data-testid="button-revalidate"
                      className="h-7 text-xs"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Re-validate
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
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
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Original Document</h3>
                {language && (
                  <Badge variant="outline" className="text-xs">
                    {language}
                  </Badge>
                )}
              </div>
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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={textSearchQuery}
                  onChange={(e) => setTextSearchQuery(e.target.value)}
                  placeholder="Search in document..."
                  className="pl-8 pr-8 h-8"
                  data-testid="input-search-text"
                />
                {textSearchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setTextSearchQuery("")}
                    data-testid="button-clear-text-search"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {textMatches.length > 0 && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-2">
                    {textSearchIndex + 1} / {textMatches.length}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPrevTextMatch}
                    data-testid="button-prev-text-match"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNextTextMatch}
                    data-testid="button-next-text-match"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-6" data-testid="text-extracted">
            {renderHighlightedText()}
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="border-b bg-muted/30 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Product JSON Output</h3>
              <Badge variant="default">Structured</Badge>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={jsonSearchQuery}
                    onChange={(e) => setJsonSearchQuery(e.target.value)}
                    placeholder="Search in JSON..."
                    className="pl-8 pr-8 h-8"
                    data-testid="input-search-json"
                  />
                  {jsonSearchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setJsonSearchQuery("")}
                      data-testid="button-clear-json-search"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {jsonMatches.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs px-2">
                      {jsonSearchIndex + 1} / {jsonMatches.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={goToPrevJsonMatch}
                      data-testid="button-prev-json-match"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={goToNextJsonMatch}
                      data-testid="button-next-json-match"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {isEditing ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                value={editedData}
                onChange={(value: string | undefined) => setEditedData(value || "")}
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

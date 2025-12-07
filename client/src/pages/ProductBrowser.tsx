import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Search, FileText, Globe, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Upload, Download, FolderOpen, File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductVariant, Document as DocumentType } from "@shared/schema";
import * as XLSX from "xlsx";

interface EnrichedProduct extends Product {
  variantCount: number;
  locales: string[];
  copyTypes: string[];
}

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

interface ProductBrowserProps {
  onUploadClick?: () => void;
  onDocumentClick?: (documentId: string) => void;
}

export default function ProductBrowser({ onUploadClick, onDocumentClick }: ProductBrowserProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(0);
  const [selectedCopyTypeIndex, setSelectedCopyTypeIndex] = useState(0);
  const [copyTypeFilter, setCopyTypeFilter] = useState<string>("all");
  const [localeFilter, setLocaleFilter] = useState<string>("all");

  const { data: products = [], isLoading } = useQuery<EnrichedProduct[]>({
    queryKey: ["/api/products"],
  });

  const { data: selectedProduct } = useQuery<ProductWithVariants>({
    queryKey: ["/api/products", selectedProductId],
    enabled: !!selectedProductId,
  });

  const { data: documents = [] } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
  });

  // Get source documents for selected product
  const sourceDocuments = selectedProduct
    ? documents.filter((doc) =>
        selectedProduct.variants.some((v) => v.documentId === doc.id)
      )
    : [];

  const uniqueCopyTypes = ["all", ...Array.from(new Set(products.flatMap((p) => p.copyTypes || [])))];
  const uniqueLocales = ["all", ...Array.from(new Set(products.flatMap((p) => p.locales || [])))];

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    const locales = product.locales || [];
    const copyTypes = product.copyTypes || [];
    
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      locales.some((locale) => locale?.toLowerCase().includes(query)) ||
      copyTypes.some((copyType) => copyType?.toLowerCase().includes(query));

    const matchesCopyType = copyTypeFilter === "all" || copyTypes.includes(copyTypeFilter);
    const matchesLocale = localeFilter === "all" || locales.includes(localeFilter);

    return matchesSearch && matchesCopyType && matchesLocale;
  });

  const getLanguageBadge = (language: string | null) => {
    if (!language) return "EN";
    const langCode =
      language === "English" ? "EN"
        : language === "Japanese" ? "JA"
          : language === "Spanish" ? "ES"
            : language === "French" ? "FR"
              : language === "German" ? "DE"
                : language === "Chinese" ? "ZH"
                  : language === "Korean" ? "KO"
                    : language.slice(0, 2).toUpperCase();
    return langCode;
  };

  const copyTypeLabels: Record<string, string> = {
    ProductCopy: "Product Copy",
    BusinessCopy: "Business Copy",
    UpgraderCopy: "Upgrader Copy",
  };

  const groupVariantsByLanguage = (variants: ProductVariant[]): Record<string, ProductVariant[]> => {
    return variants.reduce((acc, variant) => {
      const lang = variant.locale || "English";
      if (!acc[lang]) {
        acc[lang] = [];
      }
      acc[lang].push(variant);
      return acc;
    }, {} as Record<string, ProductVariant[]>);
  };

  const getAvailableLanguages = (variants: ProductVariant[]): string[] => {
    const variantsByLang = groupVariantsByLanguage(variants);
    return Object.keys(variantsByLang).sort((a, b) => {
      if (a === "English") return -1;
      if (b === "English") return 1;
      return a.localeCompare(b);
    });
  };

  const handleExportProduct = () => {
    if (!selectedProduct) return;

    const wb = XLSX.utils.book_new();
    const variantsByLocale = groupVariantsByLanguage(selectedProduct.variants);
    const locales = Object.keys(variantsByLocale);

    // Build matrix: rows = fields, columns = locales
    const rows: any[][] = [];
    
    // Metadata
    rows.push(["Product", selectedProduct.name]);
    rows.push(["Export Date", new Date().toLocaleDateString()]);
    rows.push(["Total Variants", selectedProduct.variants.length]);
    rows.push([]);

    // Header row
    const headerRow = ["Field"];
    locales.forEach((locale) => {
      headerRow.push(locale);
    });
    rows.push(headerRow);

    // Determine max array lengths
    let maxHeadlines = 0;
    let maxFeatureBullets = 0;
    let maxLegalReferences = 0;

    Object.values(variantsByLocale).forEach((variants) => {
      variants.forEach((v) => {
        maxHeadlines = Math.max(maxHeadlines, v.headlines?.length || 0);
        maxFeatureBullets = Math.max(maxFeatureBullets, v.keyFeatureBullets?.length || 0);
        maxLegalReferences = Math.max(maxLegalReferences, v.legalReferences?.length || 0);
      });
    });

    // For each copy type across all locales
    const copyTypes = Array.from(new Set(selectedProduct.variants.map((v) => v.copyType)));
    copyTypes.forEach((copyType) => {
      rows.push([copyTypeLabels[copyType] || copyType]);

      // Headlines
      for (let i = 0; i < maxHeadlines; i++) {
        const row = [`Headline ${i + 1}`];
        locales.forEach((locale) => {
          const variant = variantsByLocale[locale]?.find((v) => v.copyType === copyType);
          row.push(variant?.headlines?.[i] || "");
        });
        rows.push(row);
      }

      // Advertising Copy
      const adCopyRow = ["Advertising Copy"];
      locales.forEach((locale) => {
        const variant = variantsByLocale[locale]?.find((v) => v.copyType === copyType);
        adCopyRow.push(variant?.advertisingCopy || "");
      });
      rows.push(adCopyRow);

      // Feature Bullets
      for (let i = 0; i < maxFeatureBullets; i++) {
        const row = [`Feature ${i + 1}`];
        locales.forEach((locale) => {
          const variant = variantsByLocale[locale]?.find((v) => v.copyType === copyType);
          row.push(variant?.keyFeatureBullets?.[i] || "");
        });
        rows.push(row);
      }

      // Legal References
      for (let i = 0; i < maxLegalReferences; i++) {
        const row = [`Legal ${i + 1}`];
        locales.forEach((locale) => {
          const variant = variantsByLocale[locale]?.find((v) => v.copyType === copyType);
          row.push(variant?.legalReferences?.[i] || "");
        });
        rows.push(row);
      }

      rows.push([]); // Spacing between copy types
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Product Export");
    XLSX.writeFile(wb, `${selectedProduct.name}.xlsx`);

    toast({
      title: "Export complete",
      description: `${selectedProduct.name} exported to Excel`,
    });
  };

  const availableLanguages = selectedProduct ? getAvailableLanguages(selectedProduct.variants) : [];
  const currentLanguage = availableLanguages[selectedLanguageIndex] || "English";

  // Get all available copy types for the product (across all languages)
  const getAllCopyTypes = (variants: ProductVariant[]): string[] => {
    const copyTypes = Array.from(new Set(variants.map((v) => v.copyType)));
    return copyTypes.sort((a, b) => {
      const order = ["ProductCopy", "BusinessCopy", "UpgraderCopy"];
      return order.indexOf(a) - order.indexOf(b);
    });
  };

  const availableCopyTypes = selectedProduct ? getAllCopyTypes(selectedProduct.variants) : [];
  const currentCopyType = availableCopyTypes[selectedCopyTypeIndex] || availableCopyTypes[0] || "ProductCopy";

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={selectedProductId ? 60 : 100} minSize={30} className="flex flex-col">
        {/* Header with search and filters */}
        <div className="border-b px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-6 border-0 bg-transparent focus-visible:ring-0"
                data-testid="input-search-products"
              />
            </div>
            {onUploadClick && (
              <Button
                variant="default"
                size="sm"
                onClick={onUploadClick}
                data-testid="button-upload-document"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={copyTypeFilter} onValueChange={setCopyTypeFilter}>
              <SelectTrigger className="w-40" data-testid="select-copy-type-filter">
                <SelectValue placeholder="Copy Type" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCopyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Copy Types" : copyTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={localeFilter} onValueChange={setLocaleFilter}>
              <SelectTrigger className="w-40" data-testid="select-locale-filter">
                <SelectValue placeholder="Locale" />
              </SelectTrigger>
              <SelectContent>
                {uniqueLocales.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {locale === "all" ? "All Locales" : locale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(copyTypeFilter !== "all" || localeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCopyTypeFilter("all");
                  setLocaleFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="m-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {products.length === 0 ? "No products yet" : "No products match your filters"}
              </p>
              {products.length === 0 && onUploadClick && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload your first document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="w-24">Languages</TableHead>
                  <TableHead className="w-24">Variants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductId === product.id;

                  return (
                    <TableRow
                      key={product.id}
                      data-testid={`row-product-${product.name}`}
                      className={`cursor-pointer ${isSelected ? "bg-muted/50" : ""}`}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setSelectedLanguageIndex(0);
                      }}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.locales.length}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.variantCount}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      {selectedProductId && <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />}

      {selectedProductId && selectedProduct && (
        <Panel defaultSize={70} minSize={30} className="flex flex-col bg-muted/30">
          {/* Product header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold" data-testid="text-selected-product-name">
              {selectedProduct.name}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProduct}
                data-testid="button-export-product"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProductId(null)}
                data-testid="button-close-panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Language and Copy Type selector */}
          <div className="flex items-center gap-4 border-b px-6 py-2">
            {/* Language navigation */}
            {availableLanguages.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedLanguageIndex((prev) => (prev > 0 ? prev - 1 : availableLanguages.length - 1));
                    setSelectedCopyTypeIndex(0);
                  }}
                  data-testid="button-prev-language"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedLanguageIndex((prev) => (prev < availableLanguages.length - 1 ? prev + 1 : 0));
                    setSelectedCopyTypeIndex(0);
                  }}
                  data-testid="button-next-language"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Globe className="h-4 w-4 text-muted-foreground ml-1" />
                <span className="text-sm">{currentLanguage}</span>
              </div>
            )}

            {/* Copy Type navigation */}
            {availableCopyTypes.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedCopyTypeIndex((prev) => (prev > 0 ? prev - 1 : availableCopyTypes.length - 1))}
                  data-testid="button-prev-copy-type"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedCopyTypeIndex((prev) => (prev < availableCopyTypes.length - 1 ? prev + 1 : 0))}
                  data-testid="button-next-copy-type"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <FileText className="h-4 w-4 text-muted-foreground ml-1" />
                <span className="text-sm">{copyTypeLabels[currentCopyType] || currentCopyType}</span>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Product variants - filtered by current copy type */}
              {groupVariantsByLanguage(selectedProduct.variants)[currentLanguage]
                ?.filter((variant) => variant.copyType === currentCopyType)
                .map((variant, idx) => (
                <Card
                  key={`${variant.id}-${idx}`}
                  className="bg-background"
                  data-testid={`card-variant-${variant.id}-${idx}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mt-1">
                        {copyTypeLabels[variant.copyType] || variant.copyType}
                      </p>
                      {variant.versionNumber !== null && (
                        <p className="text-xs text-muted-foreground">
                          Version {variant.versionNumber}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {variant.headlines && variant.headlines.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Headlines</p>
                        <ul className="list-disc list-inside space-y-1">
                          {variant.headlines.map((headline, i) => (
                            <li key={i} className="text-sm">{headline}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {variant.advertisingCopy && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Advertising Copy</p>
                        <p className="text-sm whitespace-pre-wrap">{variant.advertisingCopy}</p>
                      </div>
                    )}

                    {variant.keyFeatureBullets && variant.keyFeatureBullets.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Key Features</p>
                        <ul className="list-disc list-inside space-y-1">
                          {variant.keyFeatureBullets.map((bullet, i) => (
                            <li key={i} className="text-sm">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {variant.legalReferences && variant.legalReferences.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Legal References</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {variant.legalReferences.map((ref, i) => (
                            <p key={i}>{ref}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Source documents section */}
              {sourceDocuments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Source Documents</h3>
                      <Badge variant="outline">{sourceDocuments.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {sourceDocuments.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => onDocumentClick?.(doc.id)}
                          className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded hover-elevate w-full text-left cursor-pointer"
                          data-testid={`source-doc-${doc.id}`}
                        >
                          <File className="h-3 w-3" />
                          <span className="flex-1">{doc.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getLanguageBadge(doc.language)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </Panel>
      )}
    </PanelGroup>
  );
}

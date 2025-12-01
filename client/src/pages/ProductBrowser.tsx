import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Search, FileText, Globe, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Document as DocumentType } from "@shared/schema";

interface Product {
  ProductName: string;
  Headlines?: string[];
  AdvertisingCopy?: string;
  KeyFeatureBullets?: string[];
  LegalReferences?: string[];
}

interface StructuredData {
  ProductCopy?: Product[];
  BusinessCopy?: Product[];
  UpgraderCopy?: Product[];
}

interface ProductVariant {
  documentId: string;
  documentName: string;
  language: string | null;
  copyType: "ProductCopy" | "BusinessCopy" | "UpgraderCopy";
  product: Product;
}

interface GroupedProduct {
  productName: string;
  variants: ProductVariant[];
}

export default function ProductBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(0);

  const { data: documents = [], isLoading } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
  });

  const extractAndGroupProducts = (): GroupedProduct[] => {
    const productMap = new Map<string, ProductVariant[]>();

    documents.forEach((doc) => {
      if (!doc.structuredData || !doc.isProcessed) return;

      const data = doc.structuredData as StructuredData;
      const copyTypes: Array<"ProductCopy" | "BusinessCopy" | "UpgraderCopy"> = [
        "ProductCopy",
        "BusinessCopy",
        "UpgraderCopy",
      ];

      copyTypes.forEach((copyType) => {
        const items = data[copyType];
        if (Array.isArray(items)) {
          items.forEach((product) => {
            const productName = product.ProductName;
            const variant: ProductVariant = {
              documentId: doc.id,
              documentName: doc.name,
              language: doc.language || "English",
              copyType,
              product,
            };

            if (!productMap.has(productName)) {
              productMap.set(productName, []);
            }
            productMap.get(productName)!.push(variant);
          });
        }
      });
    });

    return Array.from(productMap.entries())
      .map(([productName, variants]) => ({
        productName,
        variants,
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  };

  const allProducts = extractAndGroupProducts();

  const filteredProducts = allProducts.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.productName.toLowerCase().includes(query) ||
      item.variants.some(
        (v) =>
          v.documentName.toLowerCase().includes(query) ||
          v.language?.toLowerCase().includes(query) ||
          v.copyType.toLowerCase().includes(query)
      )
    );
  });

  const getLanguageBadge = (language: string | null) => {
    if (!language) return "EN";
    const langCode =
      language === "English"
        ? "EN"
        : language === "Japanese"
          ? "JA"
          : language === "Spanish"
            ? "ES"
            : language === "French"
              ? "FR"
              : language === "German"
                ? "DE"
                : language === "Chinese"
                  ? "ZH"
                  : language === "Korean"
                    ? "KO"
                    : language.slice(0, 2).toUpperCase();
    return langCode;
  };

  const copyTypeLabels = {
    ProductCopy: "Product Copy",
    BusinessCopy: "Business Copy",
    UpgraderCopy: "Upgrader Copy",
  };

  const groupVariantsByLanguage = (
    variants: ProductVariant[]
  ): Record<string, ProductVariant[]> => {
    return variants.reduce(
      (acc, variant) => {
        const lang = variant.language || "English";
        if (!acc[lang]) {
          acc[lang] = [];
        }
        acc[lang].push(variant);
        return acc;
      },
      {} as Record<string, ProductVariant[]>
    );
  };

  const selectedProductData = selectedProduct
    ? allProducts.find((p) => p.productName === selectedProduct)
    : null;

  const getAvailableLanguages = (variants: ProductVariant[]): string[] => {
    const variantsByLang = groupVariantsByLanguage(variants);
    return Object.keys(variantsByLang)
      .sort((a, b) => {
        if (a === "English") return -1;
        if (b === "English") return 1;
        return a.localeCompare(b);
      });
  };

  const availableLanguages = selectedProductData ? getAvailableLanguages(selectedProductData.variants) : [];
  const currentLanguage = availableLanguages[selectedLanguageIndex] || "English";

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
      {/* Left Panel - Table */}
      <Panel defaultSize={selectedProduct ? 60 : 100} minSize={30} className="flex flex-col">
        <div className="flex items-center border-b px-4 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search products, documents, languages, or copy types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-6 border-0 bg-transparent focus-visible:ring-0"
              data-testid="input-search-products"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="m-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="w-24">Languages</TableHead>
                  <TableHead className="w-24">Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((item) => {
                  const variantsByLanguage = groupVariantsByLanguage(item.variants);
                  const languageCount = Object.keys(variantsByLanguage).length;
                  const isSelected = selectedProduct === item.productName;

                  return (
                    <TableRow
                      key={item.productName}
                      data-testid={`row-product-${item.productName}`}
                      className={`cursor-pointer ${isSelected ? "bg-muted/50" : ""}`}
                      onClick={() => {
                        setSelectedProduct(item.productName);
                        setSelectedLanguageIndex(0);
                      }}
                    >
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{languageCount}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.variants.length}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      {/* Resize Handle */}
      {selectedProduct && (
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />
      )}

      {/* Right Panel - Product Details */}
      {selectedProduct && selectedProductData && (
        <Panel defaultSize={55} minSize={30} className="flex flex-col bg-muted/30">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold" data-testid="text-selected-product-name">
              {selectedProduct}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedProduct(null)}
              data-testid="button-close-panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {availableLanguages.length > 1 && (
            <div className="flex items-center justify-between border-b px-6 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLanguageIndex((prev) => (prev > 0 ? prev - 1 : availableLanguages.length - 1))}
                data-testid="button-prev-language"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{currentLanguage}</span>
                <Badge variant="outline">{getLanguageBadge(currentLanguage)}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLanguageIndex((prev) => (prev < availableLanguages.length - 1 ? prev + 1 : 0))}
                data-testid="button-next-language"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {groupVariantsByLanguage(selectedProductData.variants)[currentLanguage]?.map((variant, idx) => (
                <Card
                  key={`${variant.documentId}-${variant.copyType}-${idx}`}
                  className="bg-background"
                  data-testid={`card-variant-${variant.documentId}-${idx}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-muted-foreground">
                          {variant.documentName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {copyTypeLabels[variant.copyType]}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {copyTypeLabels[variant.copyType]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {variant.product.Headlines &&
                      variant.product.Headlines.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">
                            Headlines
                          </p>
                          <ul className="text-sm space-y-1 ml-2">
                            {variant.product.Headlines.map((headline, i) => (
                              <li key={i} className="text-muted-foreground">
                                • {headline}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {variant.product.AdvertisingCopy && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          Advertising Copy
                        </p>
                        <p className="text-sm text-foreground italic">
                          {variant.product.AdvertisingCopy}
                        </p>
                      </div>
                    )}

                    {variant.product.KeyFeatureBullets &&
                      variant.product.KeyFeatureBullets.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">
                            Key Features
                          </p>
                          <ul className="text-sm space-y-1 ml-2">
                            {variant.product.KeyFeatureBullets.map((bullet, i) => (
                              <li key={i} className="text-muted-foreground">
                                • {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {variant.product.LegalReferences &&
                      variant.product.LegalReferences.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">
                            Legal References
                          </p>
                          <ul className="text-sm space-y-1 ml-2">
                            {variant.product.LegalReferences.map((ref, i) => (
                              <li key={i} className="text-muted-foreground">
                                • {ref}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Panel>
      )}
    </PanelGroup>
  );
}

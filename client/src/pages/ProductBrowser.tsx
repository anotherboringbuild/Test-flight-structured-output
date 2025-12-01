import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Search, FileText, Globe, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product, ProductVariant } from "@shared/schema";

interface EnrichedProduct extends Product {
  variantCount: number;
  locales: string[];
  copyTypes: string[];
}

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export default function ProductBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(0);

  const { data: products = [], isLoading } = useQuery<EnrichedProduct[]>({
    queryKey: ["/api/products"],
  });

  const { data: selectedProduct } = useQuery<ProductWithVariants>({
    queryKey: ["/api/products", selectedProductId],
    enabled: !!selectedProductId,
  });

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.locales.some((locale) => locale?.toLowerCase().includes(query)) ||
      product.copyTypes.some((copyType) => copyType?.toLowerCase().includes(query))
    );
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

  const availableLanguages = selectedProduct ? getAvailableLanguages(selectedProduct.variants) : [];
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
      <Panel defaultSize={selectedProductId ? 60 : 100} minSize={30} className="flex flex-col">
        <div className="flex items-center border-b px-4 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search products, languages, or copy types..."
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
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold" data-testid="text-selected-product-name">
              {selectedProduct.name}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedProductId(null)}
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
              {groupVariantsByLanguage(selectedProduct.variants)[currentLanguage]?.map((variant, idx) => (
                <Card
                  key={`${variant.id}-${idx}`}
                  className="bg-background"
                  data-testid={`card-variant-${variant.id}-${idx}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mt-1">
                          {copyTypeLabels[variant.copyType] || variant.copyType}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {getLanguageBadge(variant.locale)}
                      </Badge>
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
            </div>
          </ScrollArea>
        </Panel>
      )}
    </PanelGroup>
  );
}

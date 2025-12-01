import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Search, FileText, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

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

  const toggleProduct = (productName: string) => {
    const next = new Set(expandedProducts);
    if (next.has(productName)) {
      next.delete(productName);
    } else {
      next.add(productName);
    }
    setExpandedProducts(next);
  };

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

  // Group variants by language
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full">
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
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Product Name</TableHead>
                <TableHead className="w-32">Languages</TableHead>
                <TableHead className="w-32">Documents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredProducts.map((item) => {
              const variantsByLanguage = groupVariantsByLanguage(item.variants);
              const languageCount = Object.keys(variantsByLanguage).length;
              const isExpanded = expandedProducts.has(item.productName);

              return (
                <div key={item.productName}>
                  <TableRow
                    data-testid={`row-product-${item.productName}`}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <button
                        onClick={() => toggleProduct(item.productName)}
                        data-testid={`button-expand-${item.productName}`}
                        className="flex items-center justify-center"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{languageCount}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.variants.length}
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={4} className="p-6">
                        <div className="space-y-6">
                          {Object.entries(variantsByLanguage)
                            .sort(([langA], [langB]) => {
                              if (langA === "English") return -1;
                              if (langB === "English") return 1;
                              return langA.localeCompare(langB);
                            })
                            .map(([language, variants]) => (
                              <div key={language}>
                                <div className="flex items-center gap-2 mb-4">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <h3 className="font-semibold text-sm">{language}</h3>
                                  <Badge variant="outline" className="ml-auto">
                                    {getLanguageBadge(language)}
                                  </Badge>
                                </div>

                                <div className="space-y-4 ml-6">
                                  {variants.map((variant, idx) => (
                                    <Card
                                      key={`${variant.documentId}-${variant.copyType}-${idx}`}
                                      className="bg-background"
                                      data-testid={`card-variant-${variant.documentId}-${idx}`}
                                    >
                                      <CardContent className="pt-4">
                                        <div className="flex items-start justify-between mb-3">
                                          <div>
                                            <p className="text-sm font-semibold text-muted-foreground">
                                              {variant.documentName}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {copyTypeLabels[variant.copyType]}
                                            </p>
                                          </div>
                                          <Badge variant="outline">
                                            {copyTypeLabels[variant.copyType]}
                                          </Badge>
                                        </div>

                                        {variant.product.Headlines &&
                                          variant.product.Headlines.length > 0 && (
                                            <div className="mb-3">
                                              <p className="text-xs text-muted-foreground font-semibold mb-1">
                                                Headlines ({variant.product.Headlines.length})
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
                                          <div className="mb-3">
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
                                            <div className="mb-3">
                                              <p className="text-xs text-muted-foreground font-semibold mb-1">
                                                Key Features ({variant.product.KeyFeatureBullets.length})
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
                                                Legal References ({variant.product.LegalReferences.length})
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
                              </div>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </div>
              );
            })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

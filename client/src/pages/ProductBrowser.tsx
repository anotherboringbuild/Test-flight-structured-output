import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Package, Leaf, Globe } from "lucide-react";
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
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Package className="h-8 w-8" />
          Product Browser
        </h1>
        <p className="text-muted-foreground">
          Browse all {allProducts.length} unique products across different languages
        </p>
      </div>

      <Input
        type="search"
        placeholder="Search products, documents, languages, or copy types..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
        data-testid="input-search-products"
      />

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No products found. Upload and process documents to see extracted products.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((item) => {
            const variantsByLanguage = groupVariantsByLanguage(item.variants);
            const languageCount = Object.keys(variantsByLanguage).length;

            return (
              <Card key={item.productName} data-testid={`card-product-${item.productName}`}>
                <CardHeader>
                  <button
                    onClick={() => toggleProduct(item.productName)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                    data-testid={`button-expand-${item.productName}`}
                  >
                    {expandedProducts.has(item.productName) ? (
                      <ChevronDown className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left">
                      <CardTitle className="text-lg">{item.productName}</CardTitle>
                    </div>
                    <Badge variant="secondary">{languageCount} language(s)</Badge>
                  </button>
                </CardHeader>

                {expandedProducts.has(item.productName) && (
                  <CardContent className="space-y-6 pt-0">
                    {Object.entries(variantsByLanguage)
                      .sort(([langA], [langB]) => {
                        // English first, then alphabetical
                        if (langA === "English") return -1;
                        if (langB === "English") return 1;
                        return langA.localeCompare(langB);
                      })
                      .map(([language, variants]) => (
                        <div key={language} className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">{language}</h3>
                            <Badge variant="outline" className="ml-auto">
                              {getLanguageBadge(language)}
                            </Badge>
                          </div>

                          <div className="ml-6 space-y-4">
                            {variants.map((variant, idx) => (
                              <Card
                                key={`${variant.documentId}-${variant.copyType}-${idx}`}
                                className="bg-muted/40"
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
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

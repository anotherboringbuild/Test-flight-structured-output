import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Package, Leaf } from "lucide-react";
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

interface ProductNode {
  documentId: string;
  documentName: string;
  copyType: "ProductCopy" | "BusinessCopy" | "UpgraderCopy";
  product: Product;
}

export default function ProductBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());

  const { data: documents = [], isLoading } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
  });

  const extractProducts = (): ProductNode[] => {
    const products: ProductNode[] = [];

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
            products.push({
              documentId: doc.id,
              documentName: doc.name,
              copyType,
              product,
            });
          });
        }
      });
    });

    return products;
  };

  const allProducts = extractProducts();

  const filteredProducts = allProducts.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.product.ProductName.toLowerCase().includes(query) ||
      item.documentName.toLowerCase().includes(query) ||
      item.copyType.toLowerCase().includes(query)
    );
  });

  const groupedByDocument = filteredProducts.reduce(
    (acc, item) => {
      const key = item.documentId;
      if (!acc[key]) {
        acc[key] = { name: item.documentName, copyTypes: {} };
      }
      if (!acc[key].copyTypes[item.copyType]) {
        acc[key].copyTypes[item.copyType] = [];
      }
      acc[key].copyTypes[item.copyType].push(item.product);
      return acc;
    },
    {} as Record<string, { name: string; copyTypes: Record<string, Product[]> }>
  );

  const toggleDocument = (docId: string) => {
    const next = new Set(expandedDocuments);
    if (next.has(docId)) {
      next.delete(docId);
    } else {
      next.add(docId);
    }
    setExpandedDocuments(next);
  };

  const copyTypeLabels = {
    ProductCopy: "Product Copy",
    BusinessCopy: "Business Copy",
    UpgraderCopy: "Upgrader Copy",
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Package className="h-8 w-8" />
          Product Browser
        </h1>
        <p className="text-muted-foreground">
          Browse all {allProducts.length} products extracted from your documents
        </p>
      </div>

      <Input
        type="search"
        placeholder="Search products, documents, or copy types..."
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
          {Object.entries(groupedByDocument).map(([docId, { name, copyTypes }]) => (
            <Card key={docId} data-testid={`card-document-${docId}`}>
              <CardHeader>
                <button
                  onClick={() => toggleDocument(docId)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  data-testid={`button-expand-${docId}`}
                >
                  {expandedDocuments.has(docId) ? (
                    <ChevronDown className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <CardTitle className="text-lg">{name}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {Object.values(copyTypes).reduce((sum, items) => sum + items.length, 0)} products
                  </Badge>
                </button>
              </CardHeader>

              {expandedDocuments.has(docId) && (
                <CardContent className="space-y-4 pt-0">
                  {Object.entries(copyTypes).map(([copyType, products]) => (
                    <div key={copyType} className="ml-4 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          {copyTypeLabels[copyType as keyof typeof copyTypeLabels]}
                        </h3>
                        <Badge variant="outline" className="ml-auto">
                          {products.length}
                        </Badge>
                      </div>
                      <div className="space-y-3 ml-6">
                        {products.map((product, idx) => (
                          <Card key={idx} className="bg-muted/40" data-testid={`card-product-${idx}`}>
                            <CardContent className="pt-4">
                              <h4 className="font-semibold mb-2 text-base">
                                {product.ProductName}
                              </h4>
                              {product.Headlines && product.Headlines.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                                    Headlines ({product.Headlines.length})
                                  </p>
                                  <ul className="text-sm space-y-1 ml-2">
                                    {product.Headlines.map((headline, i) => (
                                      <li key={i} className="text-muted-foreground">
                                        • {headline}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {product.AdvertisingCopy && (
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                                    Advertising Copy
                                  </p>
                                  <p className="text-sm text-foreground italic">
                                    {product.AdvertisingCopy}
                                  </p>
                                </div>
                              )}
                              {product.KeyFeatureBullets && product.KeyFeatureBullets.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                                    Key Features ({product.KeyFeatureBullets.length})
                                  </p>
                                  <ul className="text-sm space-y-1 ml-2">
                                    {product.KeyFeatureBullets.map((bullet, i) => (
                                      <li key={i} className="text-muted-foreground">
                                        • {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {product.LegalReferences && product.LegalReferences.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                                    Legal References ({product.LegalReferences.length})
                                  </p>
                                  <ul className="text-sm space-y-1 ml-2">
                                    {product.LegalReferences.map((ref, i) => (
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
          ))}
        </div>
      )}
    </div>
  );
}

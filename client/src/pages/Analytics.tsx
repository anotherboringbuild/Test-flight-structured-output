import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CopySectionCompleteness {
  hasProductName: boolean;
  hasHeadlines: boolean;
  hasAdvertisingCopy: boolean;
  hasKeyFeatureBullets: boolean;
  hasLegalReferences: boolean;
  headlinesCount: number;
  keyFeatureBulletsCount: number;
  legalReferencesCount: number;
}

interface DocumentAnalysis {
  id: string;
  name: string;
  hasProductCopy: boolean;
  hasBusinessCopy: boolean;
  hasUpgraderCopy: boolean;
  productCopyCompleteness: CopySectionCompleteness | null;
  businessCopyCompleteness: CopySectionCompleteness | null;
  upgraderCopyCompleteness: CopySectionCompleteness | null;
}

interface Analytics {
  totalDocuments: number;
  processedDocuments: number;
  unprocessedDocuments: number;
  sectionCoverage: {
    productCopy: number;
    businessCopy: number;
    upgraderCopy: number;
  };
  qualityMetrics: {
    documentsWithEmptyKeyFeatureBullets: number;
    documentsWithMissingFields: number;
  };
  documentAnalysis: DocumentAnalysis[];
}

function ValidationBadge({ 
  isComplete, 
  label 
}: { 
  isComplete: boolean; 
  label: string;
}) {
  return isComplete ? (
    <Badge variant="default" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      {label}
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function SectionValidation({ 
  section, 
  sectionName 
}: { 
  section: CopySectionCompleteness | null; 
  sectionName: string;
}) {
  if (!section) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{sectionName}</h4>
        <Badge variant="outline">Not present</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{sectionName}</h4>
      <div className="flex flex-wrap gap-1">
        <ValidationBadge isComplete={section.hasProductName} label="ProductName" />
        <ValidationBadge isComplete={section.hasHeadlines} label={`Headlines (${section.headlinesCount})`} />
        <ValidationBadge isComplete={section.hasAdvertisingCopy} label="AdvertisingCopy" />
        <ValidationBadge isComplete={section.hasKeyFeatureBullets} label={`Bullets (${section.keyFeatureBulletsCount})`} />
        <ValidationBadge isComplete={section.hasLegalReferences} label={`Legal (${section.legalReferencesCount})`} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Document Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Loading analytics...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-analytics">Document Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of document processing and section coverage
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-documents">{analytics.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.processedDocuments} processed, {analytics.unprocessedDocuments} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Section Coverage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>ProductCopy:</span>
                  <span className="font-medium" data-testid="text-productcopy-count">{analytics.sectionCoverage.productCopy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>BusinessCopy:</span>
                  <span className="font-medium" data-testid="text-businesscopy-count">{analytics.sectionCoverage.businessCopy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>UpgraderCopy:</span>
                  <span className="font-medium" data-testid="text-upgradercopy-count">{analytics.sectionCoverage.upgraderCopy}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Metrics</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Empty Bullets:</span>
                  <span className="font-medium" data-testid="text-empty-bullets">{analytics.qualityMetrics.documentsWithEmptyKeyFeatureBullets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Missing Fields:</span>
                  <span className="font-medium" data-testid="text-missing-fields">{analytics.qualityMetrics.documentsWithMissingFields}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Validation Report</CardTitle>
            <CardDescription>
              Detailed breakdown of sections and fields for each processed document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics.documentAnalysis.map((doc) => (
                <div key={doc.id} className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold" data-testid={`text-document-name-${doc.id}`}>{doc.name}</h3>
                    <div className="flex gap-2">
                      {doc.hasProductCopy && (
                        <Badge variant="default" data-testid={`badge-productcopy-${doc.id}`}>ProductCopy</Badge>
                      )}
                      {doc.hasBusinessCopy && (
                        <Badge variant="default" data-testid={`badge-businesscopy-${doc.id}`}>BusinessCopy</Badge>
                      )}
                      {doc.hasUpgraderCopy && (
                        <Badge variant="default" data-testid={`badge-upgradercopy-${doc.id}`}>UpgraderCopy</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <SectionValidation 
                      section={doc.productCopyCompleteness} 
                      sectionName="ProductCopy" 
                    />
                    <SectionValidation 
                      section={doc.businessCopyCompleteness} 
                      sectionName="BusinessCopy" 
                    />
                    <SectionValidation 
                      section={doc.upgraderCopyCompleteness} 
                      sectionName="UpgraderCopy" 
                    />
                  </div>
                </div>
              ))}

              {analytics.documentAnalysis.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No processed documents found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ExcelTemplateConfig {
  includeSummary: boolean;
  includeRawJSON: boolean;
  copyTypes: {
    ProductCopy: boolean;
    BusinessCopy: boolean;
    UpgraderCopy: boolean;
  };
  fields: {
    ProductName: boolean;
    Headlines: boolean;
    AdvertisingCopy: boolean;
    KeyFeatureBullets: boolean;
    LegalReferences: boolean;
  };
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string, filename: string, templateConfig?: ExcelTemplateConfig) => void;
  documentName: string;
  jsonData: string;
}

export function ExportModal({
  open,
  onClose,
  onExport,
  documentName,
  jsonData,
}: ExportModalProps) {
  const [format, setFormat] = useState("json");
  const [filename, setFilename] = useState(documentName.replace(/\.[^/.]+$/, ""));
  const [templateConfig, setTemplateConfig] = useState<ExcelTemplateConfig>({
    includeSummary: true,
    includeRawJSON: true,
    copyTypes: {
      ProductCopy: true,
      BusinessCopy: true,
      UpgraderCopy: true,
    },
    fields: {
      ProductName: true,
      Headlines: true,
      AdvertisingCopy: true,
      KeyFeatureBullets: true,
      LegalReferences: true,
    },
  });

  const handleExport = () => {
    onExport(format, filename, templateConfig);
    onClose();
  };

  const getFileExtension = () => {
    switch (format) {
      case "json":
        return ".json";
      case "csv":
        return ".csv";
      case "txt":
        return ".txt";
      case "xlsx":
        return ".xlsx";
      default:
        return ".json";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-screen overflow-y-auto" data-testid="modal-export">
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Choose the format and filename for your export.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" data-testid="radio-json" />
                <Label htmlFor="json" className="font-normal cursor-pointer">
                  JSON - Structured data format
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" data-testid="radio-csv" />
                <Label htmlFor="csv" className="font-normal cursor-pointer">
                  CSV - Comma-separated values
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" data-testid="radio-txt" />
                <Label htmlFor="txt" className="font-normal cursor-pointer">
                  TXT - Plain text
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" data-testid="radio-xlsx" />
                <Label htmlFor="xlsx" className="font-normal cursor-pointer">
                  Excel - Spreadsheet template with populated data
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                data-testid="input-filename"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {getFileExtension()}
              </span>
            </div>
          </div>

          {format === "xlsx" && (
            <div className="border rounded-lg p-3 bg-muted/50">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sheets to Include</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-summary"
                        checked={templateConfig.includeSummary}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            includeSummary: checked as boolean,
                          })
                        }
                        data-testid="checkbox-include-summary"
                      />
                      <Label htmlFor="include-summary" className="font-normal cursor-pointer">
                        Summary sheet
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="productcopy"
                        checked={templateConfig.copyTypes.ProductCopy}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            copyTypes: {
                              ...templateConfig.copyTypes,
                              ProductCopy: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-productcopy"
                      />
                      <Label htmlFor="productcopy" className="font-normal cursor-pointer">
                        ProductCopy sheet
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="businesscopy"
                        checked={templateConfig.copyTypes.BusinessCopy}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            copyTypes: {
                              ...templateConfig.copyTypes,
                              BusinessCopy: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-businesscopy"
                      />
                      <Label htmlFor="businesscopy" className="font-normal cursor-pointer">
                        BusinessCopy sheet
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="upgradercopy"
                        checked={templateConfig.copyTypes.UpgraderCopy}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            copyTypes: {
                              ...templateConfig.copyTypes,
                              UpgraderCopy: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-upgradercopy"
                      />
                      <Label htmlFor="upgradercopy" className="font-normal cursor-pointer">
                        UpgraderCopy sheet
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-rawjson"
                        checked={templateConfig.includeRawJSON}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            includeRawJSON: checked as boolean,
                          })
                        }
                        data-testid="checkbox-include-rawjson"
                      />
                      <Label htmlFor="include-rawjson" className="font-normal cursor-pointer">
                        Raw JSON sheet
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Columns to Include</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-productname"
                        checked={templateConfig.fields.ProductName}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            fields: {
                              ...templateConfig.fields,
                              ProductName: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-field-productname"
                      />
                      <Label htmlFor="field-productname" className="font-normal cursor-pointer">
                        Product Name
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-headlines"
                        checked={templateConfig.fields.Headlines}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            fields: {
                              ...templateConfig.fields,
                              Headlines: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-field-headlines"
                      />
                      <Label htmlFor="field-headlines" className="font-normal cursor-pointer">
                        Headlines
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-advertisingcopy"
                        checked={templateConfig.fields.AdvertisingCopy}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            fields: {
                              ...templateConfig.fields,
                              AdvertisingCopy: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-field-advertisingcopy"
                      />
                      <Label htmlFor="field-advertisingcopy" className="font-normal cursor-pointer">
                        Advertising Copy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-keyfeatures"
                        checked={templateConfig.fields.KeyFeatureBullets}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            fields: {
                              ...templateConfig.fields,
                              KeyFeatureBullets: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-field-keyfeatures"
                      />
                      <Label htmlFor="field-keyfeatures" className="font-normal cursor-pointer">
                        Key Feature Bullets
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-legalreferences"
                        checked={templateConfig.fields.LegalReferences}
                        onCheckedChange={(checked) =>
                          setTemplateConfig({
                            ...templateConfig,
                            fields: {
                              ...templateConfig.fields,
                              LegalReferences: checked as boolean,
                            },
                          })
                        }
                        data-testid="checkbox-field-legalreferences"
                      />
                      <Label htmlFor="field-legalreferences" className="font-normal cursor-pointer">
                        Legal References
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Preview</Label>
            <ScrollArea className="h-48 rounded-lg border bg-muted/30 p-4">
              <pre className="text-xs font-mono" data-testid="text-preview">
                {jsonData}
              </pre>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-export"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!filename.trim()}
            data-testid="button-confirm-export"
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { ComparisonView } from "../ComparisonView";
import { Toaster } from "@/components/ui/toaster";

export default function ComparisonViewExample() {
  const mockExtractedText = `iPhone 15 Pro - Product Specifications

The most advanced iPhone ever created. Experience the power of A17 Pro chip with breakthrough performance and efficiency.

Key Features:
• Titanium design - Stronger. Lighter. More Pro.
• A17 Pro chip with 6-core GPU
• ProMotion display with 120Hz refresh rate
• Advanced 48MP camera system
• All-day battery life
• Action button for quick shortcuts
• USB-C connectivity

Legal Information:
• Display has rounded corners
• Battery life varies by use
• Available space is less than total capacity
• 5G available in select markets
• Some features may not be available for all countries`;

  const mockStructuredData = JSON.stringify(
    {
      officialProductName: "iPhone 15 Pro",
      featureCopy: "The most advanced iPhone ever created. Experience the power of A17 Pro chip with breakthrough performance and efficiency.",
      featureBullets: [
        "Titanium design - Stronger. Lighter. More Pro.",
        "A17 Pro chip with 6-core GPU",
        "ProMotion display with 120Hz refresh rate",
        "Advanced 48MP camera system",
        "All-day battery life",
        "Action button for quick shortcuts",
        "USB-C connectivity"
      ],
      legalBullets: [
        "Display has rounded corners",
        "Battery life varies by use",
        "Available space is less than total capacity",
        "5G available in select markets",
        "Some features may not be available for all countries"
      ],
      advertisingCopy: "Experience the power of A17 Pro chip with breakthrough performance and efficiency in the most advanced iPhone ever created."
    },
    null,
    2
  );

  return (
    <>
      <div className="h-screen">
        <ComparisonView
          documentName="iPhone 15 Pro Specs.docx"
          extractedText={mockExtractedText}
          structuredData={mockStructuredData}
          onBack={() => console.log("Back clicked")}
          onExport={() => console.log("Export clicked")}
          onSave={(data) => console.log("Saved:", data)}
        />
      </div>
      <Toaster />
    </>
  );
}

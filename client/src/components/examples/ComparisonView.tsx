import { ComparisonView } from "../ComparisonView";
import { Toaster } from "@/components/ui/toaster";

export default function ComparisonViewExample() {
  const mockExtractedText = `Annual Report 2024

Executive Summary
This year has been marked by significant growth and expansion across all business units...

Financial Overview
Revenue increased by 24% year-over-year, reaching $150 million in total sales...

Market Analysis
Our market share has grown from 15% to 22% in the past year...`;

  const mockStructuredData = JSON.stringify(
    {
      documentType: "Annual Report",
      year: 2024,
      sections: [
        {
          heading: "Executive Summary",
          content:
            "This year has been marked by significant growth and expansion across all business units...",
          order: 1,
        },
        {
          heading: "Financial Overview",
          content:
            "Revenue increased by 24% year-over-year, reaching $150 million in total sales...",
          order: 2,
          metrics: {
            revenue: "$150M",
            growth: "24%",
          },
        },
        {
          heading: "Market Analysis",
          content:
            "Our market share has grown from 15% to 22% in the past year...",
          order: 3,
          metrics: {
            marketShare: "22%",
            previousShare: "15%",
          },
        },
      ],
    },
    null,
    2
  );

  return (
    <>
      <div className="h-screen">
        <ComparisonView
          documentName="Annual Report 2024.docx"
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

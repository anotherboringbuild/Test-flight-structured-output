import { useState } from "react";
import { ExportModal } from "../ExportModal";
import { Button } from "@/components/ui/button";

export default function ExportModalExample() {
  const [open, setOpen] = useState(true);

  const mockJson = JSON.stringify(
    {
      title: "Annual Report 2024",
      sections: [
        { heading: "Executive Summary", content: "..." },
        { heading: "Financial Overview", content: "..." },
      ],
    },
    null,
    2
  );

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Export Modal</Button>
      <ExportModal
        open={open}
        onClose={() => setOpen(false)}
        onExport={(format, filename) =>
          console.log("Export:", format, filename)
        }
        documentName="Annual Report 2024.docx"
        jsonData={mockJson}
      />
    </div>
  );
}

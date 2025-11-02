import { DocumentCard } from "../DocumentCard";

export default function DocumentCardExample() {
  return (
    <div className="p-8 max-w-md">
      <DocumentCard
        id="1"
        name="Annual Report 2024.docx"
        fileType="docx"
        size="2.4 MB"
        date="Nov 2, 2025"
        isProcessed={true}
        onView={(id) => console.log("View:", id)}
        onExport={(id) => console.log("Export:", id)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}

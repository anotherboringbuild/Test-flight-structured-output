import { DocumentLibrary } from "../DocumentLibrary";

export default function DocumentLibraryExample() {
  const mockDocuments = [
    {
      id: "1",
      name: "Annual Report 2024.docx",
      fileType: "docx" as const,
      size: "2.4 MB",
      date: "Nov 2, 2025",
      isProcessed: true,
    },
    {
      id: "2",
      name: "Contract Agreement.pdf",
      fileType: "pdf" as const,
      size: "1.2 MB",
      date: "Nov 1, 2025",
      isProcessed: true,
    },
    {
      id: "3",
      name: "Meeting Notes.pages",
      fileType: "pages" as const,
      size: "856 KB",
      date: "Oct 30, 2025",
      isProcessed: false,
    },
  ];

  return (
    <div className="p-8">
      <DocumentLibrary
        documents={mockDocuments}
        onUpload={(files) => console.log("Upload:", files)}
        onView={(id) => console.log("View:", id)}
        onExport={(id) => console.log("Export:", id)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}

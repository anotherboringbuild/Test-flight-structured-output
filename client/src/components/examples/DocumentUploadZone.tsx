import { DocumentUploadZone } from "../DocumentUploadZone";

export default function DocumentUploadZoneExample() {
  return (
    <div className="p-8">
      <DocumentUploadZone
        onFilesSelected={(files) => console.log("Files selected:", files)}
      />
    </div>
  );
}

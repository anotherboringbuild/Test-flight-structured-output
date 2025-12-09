import { useState } from "react";
import { ApiKeyModal } from "../ApiKeyModal";
import { Button } from "@/components/ui/button";

export default function ApiKeyModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <ApiKeyModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(key) => console.log("API Key saved:", key)}
      />
    </div>
  );
}

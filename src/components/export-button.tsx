"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton() {
  const handleExport = () => {
    alert("History export started. Check your downloads folder.");
  };

  return (
    <Button
      onClick={handleExport}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Download className="mr-2 h-4 w-4" /> Export History
    </Button>
  );
}

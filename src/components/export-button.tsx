"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getStorage } from "@/util";
import { Product } from "@/types";

export function ExportButton() {
  const handleExport = async () => {
    try {
      const products = (await getStorage<Product[]>("browsedProducts")) || [];

      // Prepare CSV headers
      const headers = [
        "Title",
        "Description",
        "CO2 Footprint (kg)",
        "CO2 Calculation Model",
        "ASIN",
        "Average Rating",
        "Total Reviews",
        "Date",
        "Link",
      ].join(",");

      // Format product data into CSV rows
      const rows = products.map((product) => {
        return [
          `"${product.title.replace(/"/g, '""')}"`,
          `"${(product.description || "").replace(/"/g, '""')}"`,
          product.co2Footprint,
          `"${product.co2CalculationModel || ""}"`,
          `"${product.id || ""}"`,
          product.rating?.average || "",
          product.rating?.total || "",
          new Date(product.timestamp).toLocaleDateString(),
          `"${product.link}"`,
        ].join(",");
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `greencart-history-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export history:", error);
      alert("Failed to export history. Please try again.");
    }
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

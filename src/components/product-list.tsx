"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "@/types";


interface ProductListProps {
  searchTerm: string;
  sortBy: "date" | "title" | "co2";
}

export function ProductList({ searchTerm, sortBy }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    chrome.storage.local.get("browsedProducts", (result) => {
      setProducts(result.browsedProducts || []);
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      if (changes.browsedProducts) {
        setProducts(changes.browsedProducts.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const handleDelete = (id: string) => {
    chrome.storage.local.get("browsedProducts", (result) => {
      const updated = (result.browsedProducts || []).filter(
        (p: Product) => p.id !== id
      );
      chrome.storage.local.set({ browsedProducts: updated });
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredAndSortedProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "co2") {
        return a.co2Footprint - b.co2Footprint;
      }
      return 0;
    });

    const sanitizeLink = (link: string) => {
      try {
        return new URL(link).href;
      } catch {
        return "#";
      }
    };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>CO2 Footprint</TableHead>
            <TableHead className="hidden sm:table-cell">Link</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell className="hidden md:table-cell">
                {product.description}
              </TableCell>
              <TableCell>{formatDate(product.timestamp)}</TableCell>
              <TableCell>{product.co2Footprint} kg</TableCell>
              <TableCell className="hidden sm:table-cell">
                <a
                  href={sanitizeLink(product.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline flex items-center"
                >
                  View <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Details
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

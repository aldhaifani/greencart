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
import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types";
import { getStorage, setStorage } from "@/util";
import { ProductDetailsModal } from "@/components/product-details-modal";
import { sanitizeLink } from "@/util";

type SortKey = "date" | "title" | "description" | "co2";
type SortDirection = "asc" | "desc";

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface ProductListProps {
  searchTerm: string;
}

export function ProductList({ searchTerm }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "desc",
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getStorage<Product[]>("browsedProducts");
        setProducts(products || []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while loading products"
        );
      }
    };

    loadProducts();

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

  const handleDelete = useCallback(async (id: string) => {
    try {
      const currentProducts =
        (await getStorage<Product[]>("browsedProducts")) || [];
      const updated = currentProducts.filter((p) => p.id !== id);
      await setStorage("browsedProducts", updated);
      setProducts(updated);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the product"
      );
    }
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;
        switch (sortConfig.key) {
          case "date":
            return (
              direction *
              (new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime())
            );
          case "title":
            return direction * a.title.localeCompare(b.title);
          case "description":
            return (
              direction *
              (a.description || "").localeCompare(b.description || "")
            );
          case "co2":
            return direction * (a.co2Footprint - b.co2Footprint);
          default:
            return 0;
        }
      });
  }, [products, searchTerm, sortConfig]);

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  

  return (
    <div className="relative overflow-x-auto" style={{ isolation: "isolate" }}>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 w-[20%]"
              onClick={() => handleSort("title")}
            >
              Title{getSortIcon("title")}
            </TableHead>
            <TableHead
              className="hidden md:table-cell cursor-pointer hover:bg-gray-50 w-[30%]"
              onClick={() => handleSort("description")}
            >
              Description{getSortIcon("description")}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 w-[15%]"
              onClick={() => handleSort("date")}
            >
              Date{getSortIcon("date")}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 w-[15%]"
              onClick={() => handleSort("co2")}
            >
              CO2 {getSortIcon("co2")}
            </TableHead>
            <TableHead className="hidden sm:table-cell w-[10%]">Link</TableHead>
            <TableHead className="w-[10%]">Actions</TableHead>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProduct(product)}
                  >
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
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

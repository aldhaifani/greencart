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
import { useState } from "react";

const initialProducts = [
  {
    id: 1,
    title: "Organic Cotton T-Shirt",
    description: "Eco-friendly, sustainably sourced cotton t-shirt",
    date: "2023-06-15",
    co2Footprint: 2.3,
    link: "https://example.com/organic-tshirt",
    weight: "150g",
    material: "100% Organic Cotton",
  },
  {
    id: 2,
    title: "Recycled Plastic Water Bottle",
    description: "Durable water bottle made from recycled plastic",
    date: "2023-06-14",
    co2Footprint: 1.5,
    link: "https://example.com/recycled-bottle",
    weight: "200g",
    material: "100% Recycled PET",
  },
  {
    id: 3,
    title: "Bamboo Toothbrush",
    description: "Biodegradable toothbrush with bamboo handle",
    date: "2023-06-13",
    co2Footprint: 0.8,
    link: "https://example.com/bamboo-toothbrush",
    weight: "15g",
    material: "Bamboo handle, Nylon bristles",
  },
];

interface ProductListProps {
  searchTerm: string;
  sortBy: "date" | "title" | "co2";
}

export function ProductList({ searchTerm, sortBy }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts);

  const filteredAndSortedProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "co2") {
        return a.co2Footprint - b.co2Footprint;
      }
      return 0;
    });

  const handleDelete = (id: number) => {
    setProducts(products.filter((product) => product.id !== id));
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
              <TableCell>{product.date}</TableCell>
              <TableCell>{product.co2Footprint} kg</TableCell>
              <TableCell className="hidden sm:table-cell">
                <a
                  href={product.link}
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

"use client";

import { useState } from "react";
import { ProductList } from "./product-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HistorySection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "co2">("date");

  return (
    <section>
      <div className="mb-4 space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as "date" | "title" | "co2")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="co2">CO2 Footprint</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ProductList searchTerm={searchTerm} sortBy={sortBy} />
    </section>
  );
}

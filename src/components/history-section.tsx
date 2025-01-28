"use client";

import { useState } from "react";
import { ProductList } from "./product-list";
import { Input } from "@/components/ui/input";

export function HistorySection() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <section className="relative">
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
      </div>
      <div className="relative z-0">
        <ProductList searchTerm={searchTerm} />
      </div>
    </section>
  );
}

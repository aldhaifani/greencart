"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { ExternalLink } from "lucide-react";
import { sanitizeLink } from "@/util";

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailsModal({
  product,
  onClose,
}: ProductDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Product Details</h2>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Details */}
          <div>
            <h3 className="font-medium text-lg mb-2">{product.title}</h3>
            {product.rating && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1 text-sm">
                    {product.rating.average.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  ({product.rating.total.toLocaleString()} ratings)
                </span>
              </div>
            )}
            <h4 className="font-normal text-lg mb-2">
              CO₂ Footprint: {product.co2Footprint} kg (estimate){" "}
              <span className="text-tag">{product.co2CalculationModel}</span>
            </h4>
            {/* About This Item */}
            {product.about.length > 0 && (
              <div className="border-t pt-4 mb-2">
                <h4 className="font-normal text-lg mb-2">About This Item</h4>
                <ul className="list-disc pl-6 space-y-2">
                  {product.about.map((point, index) => (
                    <li key={index} className="text-sm">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <a
              href={sanitizeLink(product.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline flex items-center font-normal text-lg"
            >
              View on Amazon <ExternalLink className="ml-1 h-3 w-4" />
            </a>
          </div>

          {/* Technical Details */}
          <div className="border-t pt-4">
            <h2 className="font-normal text-lg mb-2">Technical Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.details)
                .filter(([key]) => !key.toLowerCase().includes("review"))
                .map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">{key}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
            </div>
          </div>
          {/* Additional Metadata */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Added on: {new Date(product.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

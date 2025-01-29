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

export function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
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
            <h4 className="font-small text-lg mb-2">CO2 Footprint: {product.co2Footprint} kg</h4>
            <p className="text-gray-600">{product.description}</p>
            <a
              href={sanitizeLink(product.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline flex items-center"
            >
              View on Amazon <ExternalLink className="ml-1 h-3 w-4" />
            </a>
          </div>

          {/* Technical Details */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Technical Details</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.details).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{key}</p>
                  <p className="text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About This Item */}
          {product.about.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">About This Item</h4>
              <ul className="list-disc pl-6 space-y-2">
                {product.about.map((point, index) => (
                  <li key={index} className="text-sm">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
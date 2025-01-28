// Extract data from the product details table
function extractProductDetailsTable(): Record<string, string> {
  const details: Record<string, string> = {};

  // Add more possible selectors
  const tables = [
    "#productDetails_techSpec_section_1",
    "#productDetails_detailBullets_sections1",
    "#technicalSpecifications_section_1",
  ];

  tables.forEach((selector) => {
    const table = document.querySelector(selector);
    if (table) {
      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const key = row.querySelector("th")?.textContent?.trim();
        const value = row.querySelector("td")?.textContent?.trim();
        if (key && value) details[key] = value;
      });
    }
  });

  return details;
}

// Extract "About This Item" section
function extractAboutThisItem(): string[] {
  const aboutThisItemSection = document.querySelector("#feature-bullets");
  if (!aboutThisItemSection) return [];

  // Collect bullet points
  const bulletPoints = Array.from(
    aboutThisItemSection.querySelectorAll("li span.a-list-item")
  ).map((el) => el.textContent?.trim() || "");

  return bulletPoints.filter((point) => point !== ""); // Remove empty points
}

// Extract full product information
import { Product } from "@/types";

function extractProductInfo(): Product | null {
  try {
    const asin = extractASIN(window.location.href);
    if (!asin) {
      console.warn("ASIN not found in URL:", window.location.href);
      return null;
    }

    const title = document.querySelector("#productTitle")?.textContent?.trim();
    if (!title) {
      console.warn("Product title not found");
      return null;
    }

    const description =
      document.querySelector("#feature-bullets")?.textContent?.trim() ||
      "No Description";
    const detailsTable = extractProductDetailsTable();
    const aboutThisItem = extractAboutThisItem();

    const product: Product = {
      id: asin,
      title,
      description,
      details: detailsTable,
      about: aboutThisItem,
      link: window.location.href,
      timestamp: Date.now(),
      co2Footprint: 0, // This will be calculated by the background script
    };

    return product;
  } catch (error) {
    console.error("Error extracting product info:", error);
    return null;
  }
}

// Send product data to the background script
function sendProductToBackground(product: Product): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        { type: "SAVE_PRODUCT", payload: product },
        (response: { success: boolean; error?: string }) => {
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }

          if (response?.success) {
            console.log("Product saved successfully:", product);
            resolve();
          } else {
            const error = response?.error || "Unknown error saving product";
            console.error("Failed to save product:", error);
            reject(new Error(error));
          }
        }
      );
    } catch (error) {
      console.error("Error sending product to background:", error);
      reject(error);
    }
  });
}

// Helper function to extract ASIN from URL
export function extractASIN(url: string): string | null {
  const asinMatches = url.match(
    /\/(?:dp|gp\/product|product|exec\/obidos\/asin)\/([A-Z0-9]{10})/i
  );

  // If not found in path, check query parameters
  if (!asinMatches) {
    const queryParamMatch = url.match(/(?:ASIN|asin)=([A-Z0-9]{10})/i);
    return queryParamMatch ? queryParamMatch[1] : null;
  }

  return asinMatches[1];
}

// Main script logic
if (window.location.hostname.includes("amazon.com")) {
  const product = extractProductInfo();
  if (product) {
    sendProductToBackground(product).catch((error) => {
      console.error("Failed to save product data:", error);
    });
  } else {
    console.warn("No valid product data could be extracted from the page");
  }
}

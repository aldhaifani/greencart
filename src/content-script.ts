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
function extractProductInfo() {
  try {
    const asin = extractASIN(window.location.href);
    if (!asin) {
      console.warn("ASIN not found in URL:", window.location.href);
      return null;
    }
    // Extract basic product information
    const title =
      document.querySelector("#productTitle")?.textContent?.trim() ||
      "Unknown Title";
    const description =
      document.querySelector("#feature-bullets")?.textContent?.trim() ||
      "No Description";

    // Extract detailed information
    const detailsTable = extractProductDetailsTable();
    const aboutThisItem = extractAboutThisItem();

    return {
      id: asin,
      title,
      description,
      details: detailsTable, // Brand name, color, weight, etc.
      about: aboutThisItem, // Bullet-pointed features
      link: window.location.href,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error extracting product info:", error);
    return null;
  }  
}

// Send product data to the background script
function sendProductToBackground(product: any) {
  chrome.runtime.sendMessage(
    { type: "SAVE_PRODUCT", payload: product },
    (response) => {
      if (response?.success) {
        console.log("Product saved successfully:", product);
      } else {
        console.error("Failed to save product:", response?.error);
      }
    }
  );
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
    sendProductToBackground(product);
  }
}

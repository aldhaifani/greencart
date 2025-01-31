import { Product } from "@/types";
import "./content-script.css";

// Create a style element and inject the CSS
const injectStyles = () => {
  // CSS is now automatically injected by Vite
  return;
};

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

function extractCustomerReviews(): { average: number; total: number } | null {
  try {
    // Get the rating value
    const ratingElement = document.querySelector("#acrPopover");
    if (!ratingElement) return null;

    const ratingText = ratingElement.getAttribute("title") || "";
    const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/); // Match the first number (with optional decimal)

    // Get the total number of ratings
    const totalElement = document.querySelector("#acrCustomerReviewText");
    if (!totalElement) return null;

    const totalText = totalElement.textContent || "";
    const totalMatch = totalText.match(/(\d+(?:,\d+)*)/); // Match numbers with optional commas

    if (!ratingMatch || !totalMatch) return null;

    const average = parseFloat(ratingMatch[1]);
    const total = parseInt(totalMatch[1].replace(/,/g, ""));

    return { average, total };
  } catch (error) {
    console.error("Error extracting customer reviews:", error);
    return null;
  }
}

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
    const rating = extractCustomerReviews();

    const product: Product = {
      id: asin,
      title,
      description,
      details: detailsTable,
      about: aboutThisItem,
      link: window.location.href,
      timestamp: Date.now(),
      co2Footprint: 0, // This will be calculated by the background script
      rating: rating || undefined,
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

// Helper function to check if current page is a product page
function isProductPage(url: string): boolean {
  return /\/(?:dp|gp\/product|product|exec\/obidos\/asin)\/[A-Z0-9]{10}/i.test(
    url
  );
}

// Initialize extension on page load
const init = async () => {
  try {
    // Only proceed if we're on a product page
    if (!isProductPage(window.location.href)) {
      return;
    }

    const product = extractProductInfo();
    if (!product) return;

    await sendProductToBackground(product);

    // Create and display the CO2 overlay
    createCO2Overlay(product.id);
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
};

const createCO2Overlay = (asin: string) => {
  const overlay = document.createElement("div");
  overlay.id = "greencart-overlay";
  overlay.classList.add("greencart-overlay");

  const header = document.createElement("div");
  header.classList.add("overlay-header");

  const titleWrapper = document.createElement("div");
  titleWrapper.classList.add("overlay-title-wrapper");

  const title = document.createElement("span");
  title.classList.add("overlay-title");
  title.textContent = "GreenCart";

  titleWrapper.appendChild(title);

  const closeButton = document.createElement("button");
  closeButton.classList.add("overlay-close");
  closeButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
  closeButton.onclick = () => overlay.remove();

  header.appendChild(titleWrapper);
  header.appendChild(closeButton);

  const content = document.createElement("div");
  content.classList.add("overlay-content");

  const loadingContent = document.createElement("div");
  loadingContent.classList.add("overlay-loading");

  const spinner = document.createElement("div");
  spinner.classList.add("overlay-spinner");

  const statusText = document.createElement("div");
  statusText.classList.add("overlay-status");
  statusText.textContent = "Calculating CO₂ impact...";

  loadingContent.appendChild(spinner);
  loadingContent.appendChild(statusText);
  content.appendChild(loadingContent);

  overlay.appendChild(header);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Check existing products first
  chrome.storage.local.get(["browsedProducts"], (result) => {
    if (result.browsedProducts) {
      const products = result.browsedProducts as Product[];
      const product = products.find((p) => p.id === asin);
      if (product) {
        updateOverlayContent(product);
        return;
      }
    }

    // Add storage listener for new products
    let processed = false;
    const storageListener = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      if (processed || !changes.browsedProducts) return;

      const products = changes.browsedProducts.newValue as Product[];
      const product = products.find((p) => p.id === asin);
      if (!product) return;

      processed = true;
      updateOverlayContent(product);

      // Cleanup
      chrome.storage.onChanged.removeListener(storageListener);
      clearTimeout(timeout);
    };

    chrome.storage.onChanged.addListener(storageListener);

    // Timeout handling
    const timeout = setTimeout(() => {
      if (processed) return;
      processed = true;

      spinner.classList.remove("animate-spin");
      spinner.innerHTML =
        '<path d="M12 8v4"/><path d="M12 16h.01"/><circle cx="12" cy="12" r="10"/>';
      spinner.classList.add("yellow-loader");
      statusText.classList.add("main-text");
      statusText.textContent =
        "Calculation taking longer than expected. Please go to the extension settings and provide a valid API key.";

      chrome.storage.onChanged.removeListener(storageListener);
    }, 15000);

    // Setup MutationObserver for cleanup
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.removedNodes) {
          for (const node of mutation.removedNodes) {
            if (node === overlay) {
              // Cleanup when overlay is removed
              chrome.storage.onChanged.removeListener(storageListener);
              clearTimeout(timeout);
              observer.disconnect();
            }
          }
        }
      }
    });

    // Start observing the overlay's parent
    if (overlay.parentNode) {
      observer.observe(overlay.parentNode, {
        childList: true,
        subtree: true,
      });
    }
  });

  // Add click handler for close button
  closeButton.addEventListener("click", () => {
    overlay.remove();
  });

  // Helper function to update overlay content
  async function updateOverlayContent(product: Product) {
    const content = overlay.querySelector(".overlay-content");
    if (!content) return;

    try {
      const apiKey = await getStorage<string>("geminiApiKey");
      if (!apiKey) {
        content.innerHTML = `
          <div class="co2-result">
            <span class="co2-label">API key required</span>
          </div>
        `;
        return;
      }

      if (product.co2Footprint) {
        // Calculate impact percentage based on CO2 footprint
        // Using a more appropriate scale: 0-5kg is normal, 5-10kg is medium, >10kg is dangerous
        const impactPercentage = product.co2Footprint;
        const impactClass =
          impactPercentage <= 33
            ? "low"
            : impactPercentage <= 66
            ? "medium"
            : "high";

        content.innerHTML = `
          <div class="co2-result">
            <span class="co2-label">CO₂ footprint</span>
            <span class="co2-value">${product.co2Footprint.toFixed(2)} kg</span>
            <span class="co2-model">${
              product.co2CalculationModel || "Unknown model"
            }</span>
          </div>
          <div class="impact-scale">
            <div class="impact-labels">
              <span class="impact-label">Normal</span>
              <span class="impact-label">Dangerous</span>
            </div>
            <div class="impact-bar">
              <div class="impact-progress ${impactClass}" style="width: ${impactPercentage}%"></div>
            </div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="co2-result">
            <span class="co2-label">Calculation failed</span>
          </div>
        `;
      }
    } catch (error) {
      content.innerHTML = `
        <div class="co2-result">
          <span class="co2-label">Error checking API key</span>
        </div>
      `;
    }
  }
};

// Simplified storage access for content script
async function getStorage<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

// Main script logic
if (window.location.hostname.includes("amazon.com")) {
  injectStyles(); // Inject styles first
  init().catch((error) => {
    console.error("Failed to initialize extension:", error);
  });
}

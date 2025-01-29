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

const createCO2Overlay = (asin: string) => {
  // Create overlay container
  const overlay = document.createElement("div");
  overlay.id = "greencart-overlay";
  overlay.className = "greencart-overlay";

  // Header section
  const header = document.createElement("div");
  header.className = "greencart-header";

  const titleContainer = document.createElement("div");
  titleContainer.className = "greencart-title-container";

  const extensionName = document.createElement("span");
  extensionName.className = "greencart-extension-name";
  extensionName.textContent = "GreenCart";

  const estimateBadge = document.createElement("span");
  estimateBadge.className = "greencart-estimate-badge";
  estimateBadge.textContent = "Estimate";

  titleContainer.appendChild(extensionName);
  titleContainer.appendChild(estimateBadge);

  // Close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="close-button-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  `;
  closeButton.onclick = () => overlay.remove();

  header.appendChild(titleContainer);
  header.appendChild(closeButton);

  // Content area
  const content = document.createElement("div");
  content.className = "greencart-content";

  // Loader icon
  const loader = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  loader.setAttribute("class", "loader-symbol animate-spin");
  loader.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  loader.setAttribute("viewBox", "0 0 24 24");
  loader.setAttribute("fill", "none");
  loader.setAttribute("stroke", "currentColor");
  loader.setAttribute("stroke-width", "2");
  loader.setAttribute("stroke-linecap", "round");
  loader.setAttribute("stroke-linejoin", "round");
  loader.innerHTML =
    '<circle cx="12" cy="12" r="10" class="opacity-25"></circle><path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>';

  // Status text
  const statusText = document.createElement("div");
  statusText.className = "status-div";
  const mainText = document.createElement("span");
  mainText.className = "status-span";
  mainText.textContent = "Calculating CO₂ impact...";
  statusText.appendChild(mainText);

  content.appendChild(loader);
  content.appendChild(statusText);

  // Assemble overlay
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

      loader.classList.remove("animate-spin");
      loader.innerHTML =
        '<path d="M12 8v4"/><path d="M12 16h.01"/><circle cx="12" cy="12" r="10"/>';
      loader.setAttribute("class", "yellow-loader");
      mainText.className = "main-text";
      mainText.textContent = "Calculation taking longer than expected. Please go to the extension settings and provide a valid API key.";

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
    loader.classList.remove("animate-spin");

    try {
      const apiKey = await getStorage<string>("geminiApiKey");
      if (!apiKey) {
        loader.innerHTML =
          '<path d="M12 8v4"/><path d="M12 16h.01"/><circle cx="12" cy="12" r="10"/>';
        loader.setAttribute("class", "yellow-loader");
        mainText.className = "main-text";
        mainText.textContent =
          "API key not provided. Please go to the extension settings and provide a valid API key.";
        return;
      }

      if (product.co2Footprint) {
        // Success state
        loader.innerHTML =
          '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>';
        loader.setAttribute("class", "green-loader");
        mainText.className = "main-text-green";
        mainText.innerHTML = `
          <span class="co2-value">${product.co2Footprint} kg CO₂</span>
          <span class="co2-calc-model-tag">${product.co2CalculationModel}</span>
        `;
      } else {
        // Error state
        loader.innerHTML =
          '<path d="M18 6 6 18"/><path d="m6 6 12 12"/><path d="M12 8v4"/><path d="M12 16h.01"/>';
        loader.setAttribute("class", "loader-red");
        mainText.className = "main-text-red";
        mainText.textContent = "Failed to calculate impact";
      }
    } catch (error) {
      loader.innerHTML =
        '<path d="M18 6 6 18"/><path d="m6 6 12 12"/><path d="M12 8v4"/><path d="M12 16h.01"/>';
      loader.setAttribute("class", "loader-red");
      mainText.className = "main-text-red";
      mainText.textContent = "Error checking API key status";
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
  const product = extractProductInfo();
  if (product) {
    createCO2Overlay(product.id);
    sendProductToBackground(product).catch((error) => {
      console.error("Failed to save product data:", error);
    });
  } else {
    console.warn("Failed to extract product info");
  }
}

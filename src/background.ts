import { getStorage, setStorage } from "./util";
import { Product } from "./types";

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === "SAVE_PRODUCT") {
      handleSaveProduct(message.payload)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error }));
      return true; // Keeps the message channel open for asynchronous responses
    }
  } catch (error) {
    console.error("Message handling error:", error);
    if (error instanceof Error) {
      sendResponse({ success: false, error: error.message });
    } else {
      sendResponse({ success: false, error: String(error) });
    }
  }
  return true;
});

// Save product data to chrome.storage.local
async function handleSaveProduct(product: Product) {
  const currentData = (await getStorage<Product[]>("browsedProducts")) || [];

  // Add CO2 calculation
  const productWithCO2 = {
    ...product,
    co2Footprint: calculateCO2Footprint(),
  };

  const isDuplicate = currentData.some((p) => p.id === productWithCO2.id);
  if (isDuplicate) return;

  currentData.push(productWithCO2);
  await setStorage("browsedProducts", currentData);
}

// Example helper to get all saved products (useful for debugging or popup UI)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === "GET_PRODUCTS") {
      getStorage<any[]>("browsedProducts")
        .then((products) => sendResponse({ success: true, products }))
        .catch((error) => sendResponse({ success: false, error }));
      return true; // Keeps the message channel open for asynchronous responses
    }
  } catch (error) {
    console.error("Message handling error:", error);
    if (error instanceof Error) {
      sendResponse({ success: false, error: error.message });
    } else {
      sendResponse({ success: false, error: String(error) });
    }
  }
  return true;
});

function calculateCO2Footprint(): number {
  return 0;
}

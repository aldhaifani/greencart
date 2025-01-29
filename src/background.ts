import { getStorage, setStorage } from "./util";
import { Product } from "./types";
import { calculateCO2Footprint } from "./co2-calculator";

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
  try {
    // First check for duplicates to avoid unnecessary CO2 calculations
    const currentData = (await getStorage<Product[]>("browsedProducts")) || [];
    const isDuplicate = currentData.some((p) => p.id === product.id);
    if (isDuplicate) {
      console.log("Product already exists, skipping:", product.id);
      return;
    }

    // Attempt CO2 calculation
    let co2Result;
    try {
      co2Result = await calculateCO2Footprint(product);
    } catch (error) {
      console.error(
        "CO2 calculation failed:",
        error instanceof Error ? error.message : String(error)
      );
      throw new Error("Failed to calculate CO2 footprint");
    }

    // Only save if CO2 calculation succeeded
    const productWithCO2 = {
      ...product,
      co2Footprint: co2Result.co2Value,
      co2CalculationModel: co2Result.model,
    };

    currentData.push({
      ...productWithCO2,
      co2CalculationModel: productWithCO2.co2CalculationModel || undefined
    });
    await setStorage("browsedProducts", currentData);
    console.log("Product saved successfully with CO2 data:", productWithCO2.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to save product:", errorMessage);
    throw new Error(`Failed to save product: ${errorMessage}`);
  }
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

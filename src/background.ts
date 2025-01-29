import { getStorage, setStorage } from "./util";
import { Product } from "./types";
import { processProductWithGemini } from "./services/gemini-service";

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
    // First check for duplicates to avoid unnecessary calculations
    const currentData = (await getStorage<Product[]>("browsedProducts")) || [];
    const isDuplicate = currentData.some((p) => p.id === product.id);
    if (isDuplicate) {
      console.log("Product already exists, skipping:", product.id);
      return;
    }

    // Get API key for Gemini processing
    const apiKey = await getStorage<string>("geminiApiKey");
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Process product with Gemini (unified request for CO2, title, and description)
    const geminiResult = await processProductWithGemini(product, apiKey);

    // Save the processed product
    const productWithAI = {
      ...product,
      conciseTitle: geminiResult.conciseTitle,
      conciseDescription: geminiResult.conciseDescription,
      co2Footprint: geminiResult.co2Value,
      co2CalculationModel: geminiResult.model,
    };

    currentData.push(productWithAI);
    await setStorage("browsedProducts", currentData);
    console.log("Product saved successfully with AI data:", productWithAI.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to save product:", errorMessage);
    throw new Error(`Failed to save product: ${errorMessage}`);
  }
}

// Example helper to get all saved products (useful for debugging or popup UI)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

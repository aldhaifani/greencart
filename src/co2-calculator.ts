import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "./types";
import { getStorage } from "./util";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

function formatPrompt(product: Product): string {
  return `I need an estimate of the total CO2 footprint (in kg) for a product based on its details. The estimate should cover the full life cycle, including raw material extraction, manufacturing, transportation, usage, and disposal, if possible. If a full estimate isn't available, provide a best-approximation based on known industry data for similar products.

Here are the product details extracted from Amazon:
Product Name: ${product.title}
Brand: ${product.details.brand || "Unknown"}
Category: ${product.details.category || "Unknown"}
Material Composition: ${product.details.material || "Not specified"}
Weight: ${product.details.weight || "Not specified"}
Dimensions: ${product.details.dimensions || "Not specified"}
Manufacturing Location: ${product.details.origin || "Unknown"}
Shipping Destination: Global
Energy Consumption: ${product.details.energyConsumption || "Not applicable"}
Expected Lifespan: ${product.details.lifespan || "Not specified"}

Please provide only the numeric value of the total CO2 footprint in kg, without any additional text or explanation.`;
}

async function extractCO2Value(response: string): Promise<number> {
  // Extract the first number from the response
  const match = response.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export async function calculateCO2Footprint(product: Product): Promise<number> {
  try {
    const apiKey = await getStorage<string>("geminiApiKey");
    if (!apiKey) {
      console.warn("Gemini API key not found, using default CO2 value");
      return 0;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(formatPrompt(product));
    const co2Value = await extractCO2Value(result.response.text());
    return co2Value;
  } catch (error) {
    console.error("Error calculating CO2 footprint:", error);
    return 0;
  }
}

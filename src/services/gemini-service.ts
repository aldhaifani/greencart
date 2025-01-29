import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "../types";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-thinking-exp-01-21",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash-8b",
  "gemini-exp-1206",
];

interface GeminiResponse {
  co2Value: number;
  conciseTitle: string;
  conciseDescription: string;
  model: string;
}

function formatUnifiedPrompt(product: Product): string {
  // Build available details dynamically
  const details = Object.entries(product.details)
    .filter(
      ([_, value]) => value && value !== "Not specified" && value !== "Unknown"
    )
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `You are an expert in environmental impact assessment and product analysis. Analyze the following product details and provide a response in strict JSON format without any markdown formatting or code blocks.

Product Information:
Title: ${product.title}
Description: ${product.description}
${details ? `\nAvailable Product Details:\n${details}` : ""}

Task:
1. Calculate the estimated CO2 footprint (in kg) for the product's full lifecycle:
   - Consider manufacturing, transportation, usage, and disposal
   - Use industry standards and averages when specific data is missing
   - Base calculations on similar products in the same category
   - Factor in available details like materials, weight, dimensions, and origin
   - If energy consumption is provided, prioritize it in usage phase calculations

2. Create a concise, descriptive title (max 50 characters)
3. Write a clear, informative description (max 100 characters)

IMPORTANT: Return ONLY a valid JSON object in this exact format, with no additional text, markdown, or code blocks:
{
  "co2Value": number,
  "conciseTitle": "string",
  "conciseDescription": "string"
}

Note: Ensure the CO2 calculation is as accurate as possible based on available information. Use industry benchmarks and similar product data when specific details are missing.`;
}

function parseGeminiResponse(response: string): Partial<GeminiResponse> {
  try {
    // Remove any potential markdown code block markers
    const cleanResponse = response.replace(/^```json\s*|```\s*$/g, "").trim();

    // Parse the cleaned response
    const parsed = JSON.parse(cleanResponse);

    // Validate the structure and types of the response
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Response is not a valid JSON object");
    }

    if (typeof parsed.co2Value !== "number" || parsed.co2Value <= 0) {
      throw new Error("Invalid or missing co2Value in response");
    }

    if (
      typeof parsed.conciseTitle !== "string" ||
      parsed.conciseTitle.length === 0
    ) {
      throw new Error("Invalid or missing conciseTitle in response");
    }

    if (
      typeof parsed.conciseDescription !== "string" ||
      parsed.conciseDescription.length === 0
    ) {
      throw new Error("Invalid or missing conciseDescription in response");
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error(
      `JSON parsing error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function processProductWithGemini(
  product: Product,
  apiKey: string
): Promise<GeminiResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
      });

      const result = await model.generateContent(formatUnifiedPrompt(product));
      const response = await result.response;
      const parsed = parseGeminiResponse(response.text());

      return {
        ...parsed,
        model: modelName,
      } as GeminiResponse;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error with model ${modelName}:`, error);
    }
  }

  throw (
    lastError ||
    new Error("Failed to process product with all available models")
  );
}

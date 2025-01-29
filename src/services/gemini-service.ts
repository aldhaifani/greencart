import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "../types";

// Custom error types for better error handling
class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

class RateLimitError extends GeminiError {
  constructor(message: string = "API rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

class NetworkError extends GeminiError {
  constructor(message: string = "Network request failed") {
    super(message);
    this.name = "NetworkError";
  }
}

class ResponseParsingError extends GeminiError {
  constructor(message: string) {
    super(message);
    this.name = "ResponseParsingError";
  }
}

// Configuration interfaces for better type safety
interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

interface GeminiResponse {
  co2Value: number;
  conciseTitle: string;
  conciseDescription: string;
  model: string;
}

// Configuration constants
const generationConfig: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

// Cache configuration
const CACHE_CONFIG = {
  maxSize: 100, // Maximum number of cached responses
  ttl: 1000 * 60 * 60 * 24, // 24 hours cache TTL
} as const;

// Simple in-memory cache implementation
class ResponseCache {
  private cache: Map<string, { value: GeminiResponse; timestamp: number }>;

  constructor() {
    this.cache = new Map();
  }

  set(key: string, value: GeminiResponse): void {
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      // Remove oldest entry if cache is full
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string): GeminiResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-thinking-exp-01-21",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash-8b",
  "gemini-exp-1206",
] as const;

type GeminiModel = (typeof GEMINI_MODELS)[number];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
} as const;

// Prompt management class for better organization and maintainability
class PromptManager {
  private static readonly PROMPT_TEMPLATE = `You are an expert in environmental impact assessment and product analysis. Analyze the following product details and provide a response in strict JSON format without any markdown formatting or code blocks.

Product Information:
Title: {title}
Description: {description}
{details}

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

  static formatUnifiedPrompt(product: Product): string {
    const details = Object.entries(product.details)
      .filter(
        ([_, value]) =>
          value && value !== "Not specified" && value !== "Unknown"
      )
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    return this.PROMPT_TEMPLATE.replace("{title}", product.title)
      .replace("{description}", product.description)
      .replace(
        "{details}",
        details ? `\nAvailable Product Details:\n${details}` : ""
      );
  }
}

// Response parser class for better organization and error handling
class ResponseParser {
  static parseGeminiResponse(response: string): Partial<GeminiResponse> {
    try {
      const cleanResponse = response.replace(/^```json\s*|```\s*$/g, "").trim();
      const parsed = JSON.parse(cleanResponse);

      this.validateResponse(parsed);
      return parsed;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new ResponseParsingError(
        `JSON parsing error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private static validateResponse(
    parsed: unknown
  ): asserts parsed is GeminiResponse {
    if (!parsed || typeof parsed !== "object") {
      throw new ResponseParsingError("Response is not a valid JSON object");
    }

    const response = parsed as Partial<GeminiResponse>;

    if (typeof response.co2Value !== "number" || response.co2Value <= 0) {
      throw new ResponseParsingError("Invalid or missing co2Value in response");
    }

    if (
      typeof response.conciseTitle !== "string" ||
      response.conciseTitle.length === 0
    ) {
      throw new ResponseParsingError(
        "Invalid or missing conciseTitle in response"
      );
    }

    if (
      typeof response.conciseDescription !== "string" ||
      response.conciseDescription.length === 0
    ) {
      throw new ResponseParsingError(
        "Invalid or missing conciseDescription in response"
      );
    }
  }
}

// Model handler class for better organization and retry logic
class ModelHandler {
  private readonly genAI: GoogleGenerativeAI;
  private readonly cache: ResponseCache;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 1000; // Minimum 1 second between requests

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.cache = new ResponseCache();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= RETRY_CONFIG.maxRetries) {
        throw error;
      }

      const delayMs = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(2, retryCount),
        RETRY_CONFIG.maxDelay
      );

      console.log(`Retrying after ${delayMs}ms (attempt ${retryCount + 1})`);
      await this.delay(delayMs);
      return this.retryWithExponentialBackoff(operation, retryCount + 1);
    }
  }

  private async tryModel(
    modelName: GeminiModel,
    prompt: string
  ): Promise<GeminiResponse> {
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = ResponseParser.parseGeminiResponse(response.text());

    return {
      ...parsed,
      model: modelName,
    } as GeminiResponse;
  }

  private generateCacheKey(product: Product): string {
    return `${product.id}-${product.title}-${Object.values(
      product.details
    ).join("-")}`;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.delay(this.minRequestInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  async processProduct(product: Product): Promise<GeminiResponse> {
    const cacheKey = this.generateCacheKey(product);
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse) {
      console.log("Using cached response for product:", product.id);
      return cachedResponse;
    }

    await this.enforceRateLimit();
    const prompt = PromptManager.formatUnifiedPrompt(product);
    let lastError: Error | null = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await this.retryWithExponentialBackoff(() =>
          this.tryModel(modelName, prompt)
        );

        this.cache.set(cacheKey, response);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`Error with model ${modelName}:`, error);

        if (error instanceof RateLimitError) {
          throw error; // Don't retry on rate limit errors
        }
      }
    }

    throw (
      lastError ||
      new GeminiError("Failed to process product with all available models")
    );
  }
}

// Main export function
export async function processProductWithGemini(
  product: Product,
  apiKey: string
): Promise<GeminiResponse> {
  const handler = new ModelHandler(apiKey);
  return handler.processProduct(product);
}

import axios from "axios";

const BASE_URL = process.env.QUOTE_ENGINE_URL || "http://localhost:8081";

// ---------------- Interfaces ----------------

export interface StoreQuoteRequest {
  fileSize: number;
  permanent?: boolean;
  ttl?: number;
  fileName?: string; // For JSON detection
  fileContent?: string; // For JSON validation
}

export interface RunQuoteRequest {
  codeSize: number;
  language?: string;
}

export interface CacheQuoteRequest {
  region: string;
}

export interface Quote {
  provider: string;
  price_usd: number;
  currency?: string;
  network?: string;
  recipient?: string;
  x402_instructions?: any;
  file_size_bytes?: number;
  file_size_mb?: number;
  code_size_bytes?: number;
  language?: string;
  ttl?: number;
  operation?: string;
  metadata?: any;
}

export interface StoreQuotesResponse {
  quotes: Quote[];
  best: Quote;
  count: number;
}

// ---------------- Client Functions ----------------

/**
 * Get storage quotes from Quote Engine v2 API
 */
export async function getStoreQuotes(
  req: StoreQuoteRequest
): Promise<StoreQuotesResponse> {
  try {
    console.log("[quote-client] Fetching store quotes:", req);
    const resp = await axios.post(`${BASE_URL}/v2/quote/store`, req, {
      timeout: 10000,
    });
    return resp.data;
  } catch (err: any) {
    throw new Error(
      "Failed to get storage quotes: " + (err.message || err)
    );
  }
}

/**
 * Get compute quote from Quote Engine v2 API
 */
export async function getRunQuote(req: RunQuoteRequest): Promise<Quote> {
  try {
    console.log("[quote-client] Fetching run quote:", req);
    const resp = await axios.post(`${BASE_URL}/v2/quote/run`, req, {
      timeout: 10000,
    });
    return resp.data;
  } catch (err: any) {
    throw new Error(
      "Failed to get run quote: " + (err.message || err)
    );
  }
}

/**
 * Get cache quote from Quote Engine v2 API
 */
export async function getCacheQuote(req: CacheQuoteRequest): Promise<Quote> {
  try {
    console.log("[quote-client] Fetching cache quote:", req);
    const resp = await axios.post(`${BASE_URL}/v2/quote/cache`, req, {
      timeout: 10000,
    });
    return resp.data;
  } catch (err: any) {
    throw new Error(
      "Failed to get cache quote: " + (err.message || err)
    );
  }
}

/**
 * Get best quote for any operation
 * This is a generic function that can be used for orchestration tasks
 */
export async function getBestQuote(spec: any): Promise<any> {
  try {
    console.log("[quote-client] Fetching best quote for spec:", spec);
    const resp = await axios.post(`${BASE_URL}/v2/quote/best`, spec, {
      timeout: 10000,
    });
    return resp.data;
  } catch (err: any) {
    throw new Error(
      "Failed to get best quote: " + (err.message || err)
    );
  }
}

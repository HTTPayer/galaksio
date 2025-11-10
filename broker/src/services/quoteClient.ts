import axios from "axios";

const BASE_URL = process.env.QUOTE_ENGINE_URL || "http://localhost:8081";

// ---------------- Interfaces ----------------

export interface ComputeSpec {
  cpu_cores?: number;
  memory_gb?: number;
  storage_gb?: number;
  gpu?: string;
  provider?: string;
}

export interface StorageSpec {
  size_gb?: number;
  duration_days?: number;
  permanent?: boolean;
  provider?: string;
}

export interface CacheSpec {
  // Fields sent to quote engine (matching main.py OrchestrationRequest)
  cache_operation?: string;  // "create", "set", "get", "delete", "list", "ttl", "update-ttl"
  size_mb?: number;          // cache size in MB
  ttl_hours?: number;        // time-to-live in hours
}

// Combines compute, storage, and cache for orchestrated quote
export type OrchestrationSpec = ComputeSpec & StorageSpec & CacheSpec;

// ---------------- Client Function ----------------

/**
 * Calls the orchestrated /quote endpoint with a spec
 * Returns compute, storage, or hybrid quote based on parameters
 */
export async function getBestQuote(spec: OrchestrationSpec) {
  try {
    console.log("Fetching quote with spec:", spec);
    const resp = await axios.post(`${BASE_URL}/quote`, spec, {
      timeout: 5000,
    });
    return resp.data;
  } catch (err: any) {
    throw new Error("quote-fetch-failed: " + (err.message || err));
  }
}

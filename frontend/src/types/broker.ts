/**
 * Galaksio Broker API Types
 * 
 * IMPORTANT: These types follow the REDUCED BROKER API SPEC (Parte 3)
 * Only fields marked as "safe to use in UI" are included here.
 * 
 * DO NOT add fields from 402 responses, internal broker metadata, or any
 * fields not explicitly listed in the reduced spec.
 */

/**
 * Storage Job Response (POST /store)
 * 
 * Safe fields for UI:
 * - jobId, status
 * - result.cid, result.url, result.provider, result.size
 * - result.retrievalUrl, result.entityKey, result.dataSize (alternative names)
 */
export interface BrokerStoreResponse {
  jobId: string;
  status: string;
  result: {
    cid?: string;
    entityKey?: string;
    url?: string;
    retrievalUrl?: string;
    provider: string;
    size?: number;
    dataSize?: number;
  };
}

/**
 * Compute Job Response (POST /run)
 * 
 * Based on actual broker API documentation:
 * - jobId, status
 * - result.stdout, result.stderr, result.exitCode, result.executionTime
 */
export interface BrokerRunResponse {
  jobId: string;
  status: string;
  result: {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
  };
}

/**
 * Cache Job Response (POST /cache)
 * 
 * Safe fields for UI:
 * - jobId
 * - result.cacheId, result.endpoint, result.region, result.provider
 */
export interface BrokerCacheResponse {
  jobId: string;
  status: string;
  result: {
    cacheId: string;
    endpoint: string;
    region: string;
    provider: string;
  };
}

/**
 * Job Status Response (GET /job/{id} or GET /status/{id})
 * 
 * NOTE: This endpoint should ONLY be called by backend refresh routes.
 * Frontend UI must never call these endpoints directly.
 * 
 * This type is for internal use by /api/jobs/[brokerJobId]/refresh
 */
export interface BrokerJobStatusResponse {
  id: string;
  status: 'queued' | 'awaiting_payment' | 'running' | 'completed' | 'failed';
  provider?: string;
  result?: Record<string, unknown>;
  quote?: Record<string, unknown>;
  requester?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Store Request Body (POST /store)
 */
export interface BrokerStoreRequest {
  data: string; // Base64 or raw string
  filename?: string;
  options?: {
    permanent?: boolean;
    ttl?: number;
    provider?: string;
  };
}

/**
 * Compute/Run Request Body (POST /run)
 */
export interface BrokerRunRequest {
  code: string;
  language: string;
  gpu_type?: string;
  gpu_count?: number;
  timeout?: number;
  on_demand?: boolean;
}

/**
 * Cache Request Body (POST /cache)
 */
export interface BrokerCacheRequest {
  data: string;
  ttl?: number;
  contentType?: string;
}

/**
 * Job Kind/Type
 */
export type JobKind = 'run' | 'store' | 'cache';

/**
 * Job Status States
 */
export type JobStatus = 'queued' | 'awaiting_payment' | 'running' | 'completed' | 'failed';

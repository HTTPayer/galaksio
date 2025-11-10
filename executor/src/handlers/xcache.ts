import { HTTPayerClient } from "../client/httpayer.js";
import { Task, ExecutorResponse } from "../types.js";

const XCACHE_BASE_URL = "https://api.xcache.io";

/**
 * Handle xcache operations (cache provider)
 * Supports: create, get, set, delete, list, ttl, update-ttl, topup
 */
export async function handleXCacheOperation(
  task: Task,
  httpayer: HTTPayerClient
): Promise<ExecutorResponse> {
  const { jobId, cacheOperation, cacheId, cacheKey, cacheValue, cacheTtl, cacheRegion } = task;

  try {
    console.log(`[xcache] Handling operation: ${cacheOperation} for job ${jobId}`);

    switch (cacheOperation) {
      case "create":
        return await createCache(jobId, httpayer, cacheRegion);

      case "get":
        if (!cacheId || !cacheKey) {
          throw new Error("cacheId and cacheKey are required for get operation");
        }
        return await getKey(jobId, httpayer, cacheId, cacheKey);

      case "set":
        if (!cacheId || !cacheKey) {
          throw new Error("cacheId and cacheKey are required for set operation");
        }
        return await setKey(jobId, httpayer, cacheId, cacheKey, cacheValue, cacheTtl);

      case "delete":
        if (!cacheId || !cacheKey) {
          throw new Error("cacheId and cacheKey are required for delete operation");
        }
        return await deleteKey(jobId, httpayer, cacheId, cacheKey);

      case "list":
        if (!cacheId) {
          throw new Error("cacheId is required for list operation");
        }
        return await listKeys(jobId, httpayer, cacheId);

      case "ttl":
        if (!cacheId || !cacheKey) {
          throw new Error("cacheId and cacheKey are required for ttl operation");
        }
        return await getTTL(jobId, httpayer, cacheId, cacheKey);

      case "update-ttl":
        if (!cacheId || !cacheKey || cacheTtl === undefined) {
          throw new Error("cacheId, cacheKey, and cacheTtl are required for update-ttl operation");
        }
        return await updateTTL(jobId, httpayer, cacheId, cacheKey, cacheTtl);

      default:
        throw new Error(`Unsupported cache operation: ${cacheOperation}`);
    }
  } catch (error: any) {
    console.error(`[xcache] Operation failed:`, error.message);
    return {
      jobId,
      status: "failed",
      error: error.message,
    };
  }
}

/**
 * Create a new cache and get a unique cache ID
 */
async function createCache(
  jobId: string,
  httpayer: HTTPayerClient,
  region?: string
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/create`;
  const payload = region ? { region } : {};

  const response = await httpayer.post(url, payload);

  return {
    jobId,
    status: "completed",
    result: {
      cacheId: response.data.id,
      region: region || "us-east-1",
    },
  };
}

/**
 * Get a key from the cache
 */
async function getKey(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId: string,
  key: string
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/${cacheId}/${key}`;

  const response = await httpayer.get(url);

  return {
    jobId,
    status: "completed",
    result: {
      key: response.data.key,
      value: response.data.value,
      ttl: response.data.ttl,
    },
  };
}

/**
 * Set a key in the cache with optional TTL
 */
async function setKey(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId: string,
  key: string,
  value: any,
  ttl?: number
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/${cacheId}/${key}`;
  const payload = ttl !== undefined ? { ...value, ttl } : value;

  const response = await httpayer.put(url, payload);

  return {
    jobId,
    status: "completed",
    result: {
      key: response.data.key,
      value: response.data.value,
      ttl: response.data.ttl,
    },
  };
}

/**
 * Delete a key from the cache
 */
async function deleteKey(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId: string,
  key: string
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/${cacheId}/${key}`;

  const response = await httpayer.delete(url);

  return {
    jobId,
    status: "completed",
    result: {
      message: response.data.message,
    },
  };
}

/**
 * List all keys in the cache
 */
async function listKeys(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId: string
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/${cacheId}`;

  const response = await httpayer.get(url);

  return {
    jobId,
    status: "completed",
    result: {
      keys: response.data.keys,
      count: response.data.count,
      operations: response.data.operations,
    },
  };
}

/**
 * Get TTL for a key
 */
async function getTTL(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId: string,
  key: string
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/${cacheId}/${key}/ttl`;

  const response = await httpayer.get(url);

  return {
    jobId,
    status: "completed",
    result: {
      key: response.data.key,
      ttl: response.data.ttl,
      unit: response.data.unit,
    },
  };
}

/**
 * Update TTL for a key
 */
async function updateTTL(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId: string,
  key: string,
  ttl: number
): Promise<ExecutorResponse> {
  const url = `${XCACHE_BASE_URL}/${cacheId}/${key}/ttl`;

  const response = await httpayer.put(url, { ttl });

  return {
    jobId,
    status: "completed",
    result: {
      key: response.data.key,
      ttl: response.data.ttl,
    },
  };
}

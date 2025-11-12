import { HTTPayerClient } from "../client/httpayer.js";
import { Task, ExecutorResponse } from "../types.js";

const XCACHE_BASE_URL = process.env.XCACHE_BASE_URL || "https://api.xcache.io";

/**
 * Handle xcache storage operations
 * Simplified to focus on: create cache, set data, get data
 */
export async function handleXCacheOperation(
  task: Task,
  httpayer: HTTPayerClient
): Promise<ExecutorResponse> {
  const { jobId, meta } = task;
  const operation = meta?.operation || "set";

  try {
    console.log(`[xcache] Handling operation: ${operation} for job ${jobId}`);

    switch (operation) {
      case "create":
        // Create a new cache instance
        return await createCache(jobId, httpayer, meta?.region);

      case "set":
        // Store data in cache
        return await setData(jobId, httpayer, task);

      case "get":
        // Retrieve data from cache
        return await getData(jobId, httpayer, meta?.cacheId, meta?.key);

      default:
        throw new Error(`Unsupported xcache operation: ${operation}`);
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
 * Store data in cache
 */
async function setData(
  jobId: string,
  httpayer: HTTPayerClient,
  task: Task
): Promise<ExecutorResponse> {
  const { meta, fileInline } = task;

  // For storage operations, we need to create a cache first if cacheId not provided
  let cacheId = meta?.cacheId;

  if (!cacheId) {
    // Create new cache
    const createResp = await createCache(jobId, httpayer, meta?.region);
    if (createResp.status === "failed") {
      return createResp;
    }
    if (!createResp.result?.cacheId) {
      return {
        jobId,
        status: "failed",
        error: "Failed to create cache: no cacheId returned",
      };
    }
    cacheId = createResp.result.cacheId;
  }

  // Generate key if not provided
  const key = meta?.key || `file_${Date.now()}`;

  // Decode data from fileInline
  let value: any;
  if (fileInline) {
    try {
      // Try to decode base64
      const buffer = Buffer.from(fileInline, "base64");
      value = buffer.toString("utf-8");
    } catch {
      // If not base64, use as-is
      value = fileInline;
    }
  } else {
    value = meta?.value || "";
  }

  const url = `${XCACHE_BASE_URL}/${cacheId}/${key}`;
  const payload: any = { value };

  if (meta?.ttl) {
    payload.ttl = meta.ttl;
  }

  const response = await httpayer.put(url, payload);

  return {
    jobId,
    status: "completed",
    result: {
      cacheId,
      key: response.data.key || key,
      value: response.data.value,
      ttl: response.data.ttl,
    },
  };
}

/**
 * Get data from cache
 */
async function getData(
  jobId: string,
  httpayer: HTTPayerClient,
  cacheId?: string,
  key?: string
): Promise<ExecutorResponse> {
  if (!cacheId || !key) {
    throw new Error("cacheId and key are required for get operation");
  }

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

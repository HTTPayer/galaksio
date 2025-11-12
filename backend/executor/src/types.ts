export type TaskType = "compute" | "storage" | "cache" | "store" | "run";

/**
 * Task represents the executor request from the broker
 */
export interface Task {
  jobId: string;
  taskType: TaskType;

  // File handling for storage tasks
  fileUrl?: string;
  fileInline?: string; // base64 encoded

  // Compute task properties
  language?: "python" | "node" | "bash";
  dependencies?: string[];

  // Cache task properties (xcache)
  cacheOperation?: "create" | "get" | "set" | "delete" | "list" | "ttl" | "update-ttl";
  cacheId?: string;
  cacheKey?: string;
  cacheValue?: any;
  cacheTtl?: number;
  cacheRegion?: string;

  // Provider and metadata
  provider: string;
  meta?: Record<string, any>;
}

/**
 * ExecutorResponse represents the response sent back to the broker
 */
export interface ExecutorResponse {
  jobId: string;
  status: "completed" | "failed" | "running";
  result?: Record<string, any>;
  error?: string;
}

/**
 * HTTPayer 402 Payment Challenge
 */
export interface PaymentChallenge {
  statusCode: 402;
  accepts: Array<{
    scheme: string;
    network: string;
    payTo: string;
    asset: string;
    maxAmountRequired: string;
    description?: string;
  }>;
}

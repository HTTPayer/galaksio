import axios from "axios";
import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import { Quote } from "./quoteClient.js";

interface ExecutorRequest {
  jobId: string;
  taskType?: "store" | "run" | "cache";
  data?: any;       // for storage
  code?: string;    // for compute
  region?: string;  // for cache
  filename?: string;
  options?: any;
  language?: string;
  payload?: any;    // for orchestration tasks
  quote: any;
}

/**
 * Sends a job to the executor service
 */
export async function runOnExecutor(req: ExecutorRequest) {
  try {
    logger.info(`Sending job ${req.jobId} to executor at ${config.executorUrl}`);

    // Build executor task based on type
    const task: any = {
      jobId: req.jobId,
      taskType: req.taskType,
      provider: req.quote?.provider || req.quote?.quote?.provider,
    };

    if (req.taskType === "store") {
      // Storage task
      task.fileInline = typeof req.data === "string" ? req.data : JSON.stringify(req.data);
      task.meta = {
        fileName: req.filename,
        // Map provider to operation
        operation: req.quote.provider === "xcache" ? "set" : "pin-file",
        ttl: req.options?.ttl,
        permanent: req.options?.permanent,
      };
    } else if (req.taskType === "run") {
      // Compute task
      task.fileInline = Buffer.from(req.code || "").toString("base64");
      task.meta = {
        snippet: req.code,
        language: req.language || "python",
      };
    } else if (req.taskType === "cache") {
      // Cache task
      task.meta = {
        operation: "create",
        region: req.region || "us-east-1",
      };
    } else if (req.payload) {
      // Orchestration task with custom payload
      task.payload = req.payload;
      task.quote = req.quote;
    }

    const resp = await axios.post(
      `${config.executorUrl}/execute`,
      task,
      {
        timeout: 60000, // 60 second timeout for execution
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    logger.info(`Executor responded for job ${req.jobId}:`, resp.data);
    return resp.data;
  } catch (err: any) {
    logger.error(`Executor failed for job ${req.jobId}:`, err.message);
    throw new Error("executor-failed: " + (err.message || err));
  }
}

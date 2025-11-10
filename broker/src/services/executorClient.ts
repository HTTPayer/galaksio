import axios from "axios";
import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import { RunTaskPayload } from "../types.js";

interface ExecutorRequest {
  jobId: string;
  payload: RunTaskPayload;
  quote: any;
}

/**
 * Sends a job to the executor service
 */
export async function runOnExecutor(req: ExecutorRequest) {
  try {
    logger.info(`Sending job ${req.jobId} to executor at ${config.executorUrl}`);

    const resp = await axios.post(
      `${config.executorUrl}/execute`,
      {
        jobId: req.jobId,
        taskType: req.payload.taskType,
        fileUrl: req.payload.fileUrl,
        fileInline: req.payload.fileInline,
        language: req.payload.language,
        dependencies: req.payload.dependencies,
        provider: req.quote.quote?.provider || req.quote.provider,
        meta: req.payload.meta,
      },
      {
        timeout: 30000, // 30 second timeout
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

import express from "express";
import dotenv from "dotenv";
import { Task, ExecutorResponse } from "./types.js";
import { createHTTPayerClient } from "./client/httpayer.js";
import { handleXCacheOperation } from "./handlers/xcache.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// Initialize HTTPayer client
const httpayerClient = createHTTPayerClient();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "galaksio-executor",
    timestamp: new Date().toISOString(),
  });
});

// Main execution endpoint
app.post("/execute", async (req, res) => {
  const task: Task = req.body;

  console.log(
    `[executor] Received task - JobID: ${task.jobId}, TaskType: ${task.taskType}, Provider: ${task.provider}`
  );

  // Validate task
  if (!task.jobId || !task.taskType || !task.provider) {
    const errorResponse: ExecutorResponse = {
      jobId: task.jobId || "unknown",
      status: "failed",
      error: "Invalid task: jobId, taskType, and provider are required",
    };
    return res.status(400).json(errorResponse);
  }

  // Extract cache parameters from meta if they exist there
  if (task.taskType === "cache" && task.meta) {
    task.cacheOperation = task.cacheOperation || task.meta.cacheOperation;
    task.cacheId = task.cacheId || task.meta.cacheId;
    task.cacheKey = task.cacheKey || task.meta.cacheKey;
    task.cacheValue = task.cacheValue || task.meta.cacheValue;
    task.cacheTtl = task.cacheTtl || task.meta.cacheTtl;
    task.cacheRegion = task.cacheRegion || task.meta.cacheRegion;
  }

  try {
    let result: ExecutorResponse;

    // Route based on task type and provider
    switch (task.taskType) {
      case "cache":
        if (task.provider === "xcache") {
          result = await handleXCacheOperation(task, httpayerClient);
        } else {
          result = {
            jobId: task.jobId,
            status: "failed",
            error: `Unsupported cache provider: ${task.provider}`,
          };
        }
        break;

      case "storage":
        result = {
          jobId: task.jobId,
          status: "failed",
          error: "Storage tasks not yet implemented in TypeScript executor",
        };
        break;

      case "compute":
        result = {
          jobId: task.jobId,
          status: "failed",
          error: "Compute tasks not yet implemented in TypeScript executor",
        };
        break;

      default:
        result = {
          jobId: task.jobId,
          status: "failed",
          error: `Unsupported task type: ${task.taskType}`,
        };
    }

    // Return response based on status
    if (result.status === "failed") {
      console.error(`[executor] Task ${task.jobId} failed:`, result.error);
      return res.status(500).json(result);
    }

    console.log(`[executor] Task ${task.jobId} completed successfully`);
    return res.json(result);
  } catch (error: any) {
    console.error(`[executor] Unexpected error:`, error);
    const errorResponse: ExecutorResponse = {
      jobId: task.jobId,
      status: "failed",
      error: error.message || "Internal executor error",
    };
    return res.status(500).json(errorResponse);
  }
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("[executor] Error:", err);
    res.status(500).json({ error: err.message || "internal" });
  }
);

// Start server
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`[INFO] Galaksio Executor (TypeScript) running on port ${PORT}`);
  console.log(
    `[INFO] HTTPayer Router URL: ${process.env.HTTPAYER_ROUTER_URL || "http://localhost:3000"}`
  );
  console.log(`[INFO] Supported providers: xcache`);
});

import express from "express";
import dotenv from "dotenv";
import { Task, ExecutorResponse } from "./types.js";
import { createHTTPayerClient } from "./client/httpayer.js";
import { handleXCacheOperation } from "./handlers/xcache.js";
import { handleOpenX402Operation } from "./handlers/openx402.js";
import { handleMeritSystemsOperation } from "./handlers/meritSystems.js";

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
    version: "2.0.0",
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

  try {
    let result: ExecutorResponse;

    // Route based on task type
    switch (task.taskType) {
      case "store":
        // Storage operations (xcache or openx402)
        if (task.provider === "xcache") {
          result = await handleXCacheOperation(task, httpayerClient);
        } else if (task.provider === "openx402") {
          result = await handleOpenX402Operation(task, httpayerClient);
        } else {
          throw new Error(`Unsupported storage provider: ${task.provider}`);
        }
        break;

      case "run":
        // Compute operations (merit-systems only)
        if (task.provider === "merit-systems") {
          result = await handleMeritSystemsOperation(task, httpayerClient);
        } else {
          throw new Error(`Unsupported compute provider: ${task.provider}`);
        }
        break;

      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }

    // Return response
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
  console.log(`[INFO] Galaksio Executor v2.0 running on port ${PORT}`);
  console.log(
    `[INFO] HTTPayer Router URL: ${process.env.HTTPAYER_ROUTER_URL || "http://localhost:3000"}`
  );
  console.log(`[INFO] Supported providers: xcache, openx402, merit-systems`);
  console.log(`[INFO] Task types: store, run`);
});

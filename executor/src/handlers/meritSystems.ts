import { Task, ExecutorResponse } from "../types.js";
import { HTTPayerClient } from "../client/httpayer.js";

const MERIT_SYSTEMS_BASE_URL = 'https://echo.router.merit.systems/resource/e2b/execute';

/**
 * Handle Merit Systems compute operations (E2B execution)
 * Supports code execution through E2B sandboxes
 */
export async function handleMeritSystemsOperation(
  task: Task,
  httpayer: HTTPayerClient
): Promise<ExecutorResponse> {
  const { jobId, meta } = task;
  const operation = meta?.operation || "execute";

  try {
    console.log(`[merit-systems] Handling operation: ${operation} for job ${jobId}`);

    switch (operation) {
      case "execute":
        return await executeCode(jobId, httpayer, task);

      default:
        throw new Error(`Unsupported Merit Systems operation: ${operation}`);
    }
  } catch (error: any) {
    console.error(`[merit-systems] Operation failed:`, error.message);
    return {
      jobId,
      status: "failed",
      error: error.message,
    };
  }
}

/**
 * Execute code snippet through E2B sandbox
 */
async function executeCode(
  jobId: string,
  httpayer: HTTPayerClient,
  task: Task
): Promise<ExecutorResponse> {
  const url = MERIT_SYSTEMS_BASE_URL;

  // Get code snippet from task
  let snippet: string;

  if (task.meta?.snippet) {
    snippet = task.meta.snippet;
  } else if (task.fileInline) {
    // Decode base64 if provided
    snippet = Buffer.from(task.fileInline, 'base64').toString('utf-8');
  } else if (task.fileUrl) {
    // Download code from URL
    const response = await fetch(task.fileUrl);
    snippet = await response.text();
  } else {
    throw new Error("Code snippet required: provide meta.snippet, fileInline, or fileUrl");
  }

  console.log(`[merit-systems] Executing code snippet (${snippet.length} bytes)`);

  const payload = {
    snippet: snippet,
  };

  // Use HTTPayer to handle potential 402 payment challenges
  const response = await httpayer.post(url, payload);

  return {
    jobId,
    status: "completed",
    result: {
      output: response.data.output || response.data.result,
      error: response.data.error,
      executionTime: response.data.executionTime,
      rawResponse: response.data,
    },
  };
}

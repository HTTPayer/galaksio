import { HTTPayerClient } from "../client/httpayer.js";
import { Task, ExecutorResponse } from "../types.js";

const OPENX402_BASE_URL = process.env.OPENX402_BASE_URL || "https://ipfs.openx402.ai";

/**
 * Handle OpenX402 IPFS operations
 * Simplified to focus on: pin-file (primary storage operation)
 */
export async function handleOpenX402Operation(
  task: Task,
  httpayer: HTTPayerClient
): Promise<ExecutorResponse> {
  const { jobId, meta } = task;
  const operation = meta?.operation || "pin-file";

  try {
    console.log(`[openx402] Handling operation: ${operation} for job ${jobId}`);

    switch (operation) {
      case "pin-file":
        // Detect if it's a JSON file and route to appropriate endpoint
        const isJsonFile = detectJsonFile(task);
        if (isJsonFile) {
          console.log(`[openx402] Detected JSON file, using /pin/json endpoint`);
          return await pinJson(jobId, httpayer, task);
        }
        // Direct file pin to IPFS (primary operation)
        return await pinFile(jobId, httpayer, task);

      default:
        throw new Error(`Unsupported OpenX402 operation: ${operation}`);
    }
  } catch (error: any) {
    console.error(`[openx402] Operation failed:`, error.message);
    return {
      jobId,
      status: "failed",
      error: error.message,
    };
  }
}

/**
 * Detect if the uploaded file is a JSON file
 */
function detectJsonFile(task: Task): boolean {
  // Check file extension from fileName in meta
  const fileName = task.meta?.fileName;
  if (fileName && fileName.toLowerCase().endsWith('.json')) {
    return true;
  }

  // Check if fileUrl ends with .json
  if (task.fileUrl && task.fileUrl.toLowerCase().endsWith('.json')) {
    return true;
  }

  // Try to parse fileInline as JSON
  if (task.fileInline) {
    try {
      // Attempt to decode base64 first
      let content: string;
      try {
        content = Buffer.from(task.fileInline, 'base64').toString('utf-8');
      } catch {
        content = task.fileInline;
      }

      // Try to parse as JSON
      JSON.parse(content);
      return true;
    } catch {
      // Not valid JSON
      return false;
    }
  }

  return false;
}

/**
 * Pin JSON data to IPFS using /pin/json endpoint (0.01 USDC)
 */
async function pinJson(
  jobId: string,
  httpayer: HTTPayerClient,
  task: Task
): Promise<ExecutorResponse> {
  const url = `${OPENX402_BASE_URL}/pin/json`;

  let jsonData: any;

  if (task.fileInline) {
    // Handle base64 or plain string data
    let content: string;
    try {
      content = Buffer.from(task.fileInline, "base64").toString("utf-8");
    } catch {
      content = task.fileInline;
    }

    // Parse JSON
    try {
      jsonData = JSON.parse(content);
    } catch (error) {
      throw new Error("Invalid JSON content in fileInline");
    }
  } else if (task.fileUrl) {
    // Download JSON from URL first
    const fileResponse = await fetch(task.fileUrl);
    jsonData = await fileResponse.json();
  } else {
    throw new Error("Either fileInline or fileUrl is required");
  }

  // Send JSON data directly to /pin/json endpoint
  const response = await httpayer.post(url, jsonData, {
    "Content-Type": "application/json",
  });

  return {
    jobId,
    status: "completed",
    result: {
      success: response.data.success,
      id: response.data.id,
      ipfsHash: response.data.ipfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.ipfsHash}`,
      pinataUrl: response.data.pinataUrl,
      endpoint: "/pin/json",
      priceUsd: 0.01,
    },
  };
}

/**
 * Direct file pin to IPFS - primary storage operation
 */
async function pinFile(
  jobId: string,
  httpayer: HTTPayerClient,
  task: Task
): Promise<ExecutorResponse> {
  const url = `${OPENX402_BASE_URL}/pin/file`;

  const formData = new FormData();

  if (task.fileInline) {
    // Handle base64 or plain string data
    let buffer: Buffer;
    try {
      buffer = Buffer.from(task.fileInline, "base64");
    } catch {
      buffer = Buffer.from(task.fileInline, "utf-8");
    }

    const blob = new Blob([buffer]);
    const fileName = task.meta?.fileName || "file";
    formData.append("file", blob, fileName);
  } else if (task.fileUrl) {
    // Download file from URL first
    const fileResponse = await fetch(task.fileUrl);
    const fileBlob = await fileResponse.blob();
    const fileName =
      task.meta?.fileName || task.fileUrl.split("/").pop() || "file";
    formData.append("file", fileBlob, fileName);
  } else {
    throw new Error("Either fileInline or fileUrl is required");
  }

  const response = await httpayer.post(url, formData);

  return {
    jobId,
    status: "completed",
    result: {
      success: response.data.success,
      id: response.data.id,
      filename: response.data.filename,
      ipfsHash: response.data.ipfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.ipfsHash}`,
      pinataUrl: response.data.pinataUrl,
    },
  };
}

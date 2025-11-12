import express, { Request, Response } from "express";
import { getStoreQuotes } from "../services/quoteClient.js";
import { createJob, updateJob } from "../db/jobStore.js";
import { X402Response } from "../types.js";

const router = express.Router();

/**
 * Store endpoint - returns quoted instructions with x402 payment gating
 *
 * Flow:
 * 1. Get quotes from xcache/IPFS (includes x402 instructions)
 * 2. If unpaid, return 402 with broker payment requirement
 * 3. If paid, return the quoted instructions for client to execute payment
 *
 * Request body:
 * - data: base64-encoded file or raw string
 * - filename: optional filename
 * - options: { permanent?: boolean, ttl?: number }
 */
router.post("/store", async (req: Request, res: Response) => {
  const { data, filename, options } = req.body;

  // Validate input
  if (!data) {
    return res.status(400).json({ error: "data is required" });
  }

  // Calculate file size
  const fileSize = calculateSize(data);

  // Create job
  const job = createJob({
    requester: (req.headers["x-wallet"] as string) || "anonymous",
    status: "awaiting_payment",
  });

  try {
    // Get quotes from xcache and IPFS (includes x402 instructions)
    const quotesResponse = await getStoreQuotes({
      fileSize,
      permanent: options?.permanent || false,
      ttl: options?.ttl || 3600,
      fileName: filename, // Pass filename for JSON detection
      fileContent: typeof data === "string" ? data : undefined, // Pass content for JSON validation
    });

    if (!quotesResponse.quotes || quotesResponse.quotes.length === 0) {
      updateJob(job.id, { status: "failed", result: { error: "No providers available" } });
      return res.status(503).json({ error: "No providers available" });
    }

    // Select cheapest provider
    const bestQuote = quotesResponse.best;

    updateJob(job.id, {
      status: "payment_required",
      quote: bestQuote,
      provider: bestQuote.provider,
    });

    // Payment verified by middleware - return the quoted instructions
    updateJob(job.id, { status: "instructions_provided" });

    // Return the x402 instructions from the quote for the client to execute
    return res.json({
      jobId: job.id,
      status: "instructions_provided",
      instructions: bestQuote.x402_instructions || bestQuote.metadata?.x402_instructions,
      provider: bestQuote.provider,
      price_usd: bestQuote.price_usd,
      metadata: bestQuote.metadata,
      allQuotes: quotesResponse.quotes, // Include all quotes so client can choose
    });
  } catch (err: any) {
    console.error(`[broker] Store job ${job.id} failed:`, err);
    updateJob(job.id, { status: "failed", result: { error: err.message } });

    // Return X402Response with error
    const errorResponse: X402Response = {
      x402Version: 1,
      error: err.message,
    };

    return res.status(500).json(errorResponse);
  }
});

/**
 * Calculate size of data in bytes
 */
function calculateSize(data: any): number {
  if (typeof data === "string") {
    // Check if it's base64
    try {
      const buffer = Buffer.from(data, "base64");
      return buffer.length;
    } catch {
      // Plain string
      return Buffer.from(data).length;
    }
  } else if (data.url) {
    // URL - will need to fetch to get size
    // For now, return 0 and let executor handle it
    return 0;
  } else if (typeof data === "object") {
    // JSON data
    return Buffer.from(JSON.stringify(data)).length;
  }
  return 0;
}

export default router;

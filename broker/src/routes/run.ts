import express, { Request, Response } from "express";
import { getRunQuote } from "../services/quoteClient.js";
import { createJob, updateJob } from "../db/jobStore.js";
import { X402Response } from "../types.js";

const router = express.Router();

/**
 * Run endpoint - returns quoted instructions with x402 payment gating
 *
 * Flow:
 * 1. Get quote from Merit Systems (includes x402 instructions)
 * 2. If unpaid, return 402 with broker payment requirement
 * 3. If paid, return the quoted instructions for client to execute payment
 *
 * Request body:
 * - code: code snippet to execute (string or base64)
 * - language: optional language (python, javascript, etc.)
 */
router.post("/run", async (req: Request, res: Response) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: "code is required" });
  }

  // Calculate code size
  const codeSize = Buffer.from(
    typeof code === "string" ? code : JSON.stringify(code)
  ).length;

  const job = createJob({
    requester: (req.headers["x-wallet"] as string) || "anonymous",
    status: "awaiting_payment",
  });

  try {
    // Get quote from Merit Systems (includes x402 instructions)
    const quote = await getRunQuote({
      codeSize,
      language: language || "python",
    });

    updateJob(job.id, {
      status: "payment_required",
      quote,
      provider: "merit-systems",
    });

    // Payment verified by middleware - return the quoted instructions
    updateJob(job.id, { status: "instructions_provided" });

    // Return the x402 instructions from the quote for the client to execute
    return res.json({
      jobId: job.id,
      status: "instructions_provided",
      instructions: quote.x402_instructions || quote.metadata?.x402_instructions,
      provider: quote.provider,
      price_usd: quote.price_usd,
      metadata: quote.metadata,
    });
  } catch (err: any) {
    console.error(`[broker] Run job ${job.id} failed:`, err);
    updateJob(job.id, { status: "failed", result: { error: err.message } });

    // Return X402Response with error
    const errorResponse: X402Response = {
      x402Version: 1,
      error: err.message,
    };

    return res.status(500).json(errorResponse);
  }
});

export default router;

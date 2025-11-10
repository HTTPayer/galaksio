import { Request, Response, NextFunction } from "express";
import { verify } from "x402/verify";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

/**
 * X402 Payment verification middleware
 * Implements the x402 payment protocol for gating endpoints
 * See: https://github.com/coinbase/x402
 */
export function enforceX402(req: Request, res: Response, next: NextFunction) {
  const paymentHeader = req.headers["x-payment"] as string | undefined;
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  // If no payment header, return 402 with payment requirements
  if (!paymentHeader) {
    const paymentRequirements = {
      x402Version: "0.1",
      accepts: [
        {
          scheme: "exact" as const,
          network: "base-sepolia" as const,
          payTo: config.brokerWallet,
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          maxAmountRequired: "1000000", // 1 USDC (6 decimals)
          resource: fullUrl,
          description: "Payment required to execute task",
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
        }
      ]
    };

    logger.info(`Payment required for ${fullUrl}`);
    return res.status(402).json(paymentRequirements);
  }

  // Verify the payment using x402 SDK
  const paymentRequirements = {
    scheme: "exact" as const,
    network: "base-sepolia" as const,
    payTo: config.brokerWallet,
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    maxAmountRequired: "1000000",
    resource: fullUrl,
    description: "Payment required to execute task",
    mimeType: "application/json",
    maxTimeoutSeconds: 300,
  };

  // Parse the payment payload from the header
  try {
    const paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString());

    // Verify payment using x402 SDK (async)
    verify(paymentPayload, paymentRequirements)
      .then((verificationResult) => {
        logger.info(`Payment verified for ${fullUrl}:`, verificationResult);

        // Attach payment info to request for logging/tracking
        (req as any).paymentVerified = true;
        (req as any).paymentDetails = verificationResult;

        return next();
      })
      .catch((error: any) => {
        logger.error(`Payment verification failed for ${fullUrl}:`, error.message);
        return res.status(402).json({
          error: "payment-verification-failed",
          message: error.message || "Invalid payment",
        });
      });
  } catch (error: any) {
    logger.error(`Failed to parse payment header for ${fullUrl}:`, error.message);
    return res.status(402).json({
      error: "invalid-payment-header",
      message: "Failed to parse payment header",
    });
  }
}

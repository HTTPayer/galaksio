import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import jobRoutes from "./routes/job.js";
import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { paymentMiddleware } from "x402-express";

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

// ──────────────────────────────
// X402 Payment Middleware Setup
// ──────────────────────────────
// Define per-endpoint payment rules
app.use(
  paymentMiddleware(
    "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F", // receiver wallet
    {
      "POST /run": {
        price: "0.001", 
        network: "base-sepolia",
      },
      "POST /a2a/message": {
        price: "0.0005",
        network: "base-sepolia",
      },
    },
    {
      url: "https://x402.org/facilitator", // facilitator handles A2A execution/payment
    }
  )
);

// Health check (unprotected)
app.get("/health", (req, res) => {
  logger.info("Health check request");
  res.json({ ok: true, service: "galaksio-broker", timestamp: new Date().toISOString() });
});

// Attach job routes (already protected by x402 middleware above)
app.use("/", jobRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
  logger.error("Error:", err);
  res.status(500).json({ error: err.message || "internal" });
});

app.use((req, res, next) => {
  console.log("x402 payment verification result:", (req as any).x402);
  next();
});

// Start server
app.listen(config.port, () => {
  logger.info(`Galaksio Broker running on port ${config.port}`);
  logger.info(`Quote Engine URL: ${config.quoteEngineUrl}`);
  logger.info(`Executor URL: ${config.executorUrl}`);
  logger.info(`Broker Wallet: ${config.brokerWallet}`);
});

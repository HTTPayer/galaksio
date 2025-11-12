import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import storeRoutes from "./routes/store.js";
import runRoutes from "./routes/run.js";
import cacheRoutes from "./routes/cache.js";
import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { createMiddleware } from "@faremeter/middleware/express";
import { paymentMiddleware } from "x402-express";

import {
  lookupKnownSPLToken,
  x402Exact,
  xSolanaSettlement,
} from "@faremeter/info/solana";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import { swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

// ──────────────────────────────
// X402 Payment Middleware Setup
// ──────────────────────────────
// Static pricing for broker fee (separate from service provider pricing)
app.use(
  paymentMiddleware(
    config.brokerWallet as any, // receiver wallet
    {
      "POST /store": {
        price: "$0.005",
        network: "base-sepolia" as const,
      },
      "POST /run": {
        price: "$0.005",
        network: "base-sepolia" as const,
      },
      "POST /cache": {
        price: "$0.005",
        network: "base-sepolia" as const,
      },
    },
    {
      url: "https://x402.org/facilitator", // facilitator handles A2A execution/payment
    }
  )
);

// ──────────────────────────────
// API Documentation
// ──────────────────────────────
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Galaksio Broker API Docs",
}));

// OpenAPI JSON spec
app.get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Health check (unprotected)
app.get("/health", (req, res) => {
  logger.info("Health check request");
  res.json({
    ok: true,
    service: "galaksio-broker",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Attach simplified routes
app.use("/", storeRoutes);
app.use("/", runRoutes);
app.use("/", cacheRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
  logger.error("Error:", err);
  res.status(500).json({ error: err.message || "internal" });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Galaksio Broker v2.0 running on port ${config.port}`);
  logger.info(`Quote Engine URL: ${config.quoteEngineUrl}`);
  logger.info(`Executor URL: ${config.executorUrl}`);
  logger.info(`Broker Wallet: ${config.brokerWallet}`);
  logger.info(`Endpoints: POST /store, POST /run, POST /cache`);
  logger.info(`API Documentation: http://localhost:${config.port}/docs`);
  logger.info(`OpenAPI Spec: http://localhost:${config.port}/openapi.json`);
});

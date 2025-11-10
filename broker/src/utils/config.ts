/**
 * Configuration utility
 * Centralizes environment variable access
 */
export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  brokerWallet: process.env.BROKER_WALLET || "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
  quoteEngineUrl: process.env.QUOTE_ENGINE_URL || "http://localhost:8081",
  executorUrl: process.env.EXECUTOR_URL || "http://localhost:8082",
  debug: process.env.DEBUG === "true",
};

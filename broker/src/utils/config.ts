/**
 * Configuration utility
 * Centralizes environment variable access
 */
import dotenv from "dotenv";
dotenv.config();
export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  // Solana payment configuration (supports both file path and private key)
  solanaKeypairPath: process.env.SOLANA_KEYPAIR_PATH, // Path to JSON keypair file
  solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY, // Base58 encoded private key (alternative to keypair path)
  solanaNetwork: (process.env.SOLANA_NETWORK as "devnet" | "mainnet-beta") || "devnet",
  facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.corbits.dev",
  // Legacy EVM wallet (deprecated)
  brokerWallet: process.env.BROKER_WALLET || "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
  quoteEngineUrl: process.env.QUOTE_ENGINE_URL || "http://localhost:8081",
  executorUrl: process.env.EXECUTOR_URL || "http://localhost:8082",
  debug: process.env.DEBUG === "true",
};

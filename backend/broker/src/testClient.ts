import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount, nonceManager } from "viem/accounts";
import { wrapFetchWithPayment } from "x402-fetch";
import dotenv from "dotenv";

async function main() {
  dotenv.config();

  let PRIVATE_KEY = process.env.CLIENT_PRIVATE_KEY || "";
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
  }
  console.log("[client] Using private key:", PRIVATE_KEY ? `${PRIVATE_KEY.slice(0, 6)}...${PRIVATE_KEY.slice(-4)}` : "NOT SET");

  // Create a wallet client
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`, {
    nonceManager, // Prevent nonce collisions
  });
  console.log("[client] Using account address:", account.address);
  console.log("[client] Using chain:", baseSepolia.name, "(ID:", baseSepolia.id, ")");
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || baseSepolia.rpcUrls.default.http[0]),
  });

  // Wrap the fetch function with payment handling
  const fetchWithPay = wrapFetchWithPayment(fetch, client as any);

  // Make a request that may require payment
  const response = await fetchWithPay("http://localhost:4025/weather", {
    method: "GET",
  });

  const data = await response.json();
  console.log("Response data:", data);
}

main().catch(console.error);
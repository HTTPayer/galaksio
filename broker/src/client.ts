import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment } from "x402-fetch";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

let PRIVATE_KEY = process.env.CLIENT_PRIVATE_KEY || "";
if (!PRIVATE_KEY.startsWith("0x")) {
  PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}
console.log("[client] Using private key:", PRIVATE_KEY ? `${PRIVATE_KEY.slice(0, 6)}...${PRIVATE_KEY.slice(-4)}` : "NOT SET");

// Create a wallet client
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
console.log("[client] Using account address:", account.address);
const client = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

// Wrap the fetch function with payment handling
const fetchWithPay = wrapFetchWithPayment(fetch, client as any);

const BROKER_URL = process.env.BROKER_URL || "http://localhost:8080";
const XCACHE_API_URL = process.env.XCACHE_API_URL || "https://api.xcache.io";

/**
 * XCache Client - Direct API integration with galaksio router for create/topup only
 */
class XCacheClient {
  private fetchWithPay: typeof fetch;
  private brokerUrl: string;
  private xcacheApiUrl: string;

  constructor(fetchWithPay: typeof fetch, brokerUrl: string, xcacheApiUrl: string) {
    this.fetchWithPay = fetchWithPay;
    this.brokerUrl = brokerUrl;
    this.xcacheApiUrl = xcacheApiUrl;
  }

  /**
   * Create a new cache
   */
  async createCache(region?: string) {
    console.log("\n[xcache-client] Creating new cache...");
    const response = await this.fetchWithPay(`${this.brokerUrl}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        taskType: "cache",
        provider: "xcache",
        meta: {
          cacheOperation: "create",
          cacheRegion: region || "us-east-1"
        }
      })
    });

    const data = await response.json();
    console.log("[xcache-client] Cache created:", data);
    return data;
  }

  /**
   * Top up cache with additional operations
   */
  async topupCache(cacheId: string) {
    console.log(`\n[xcache-client] Topping up cache ${cacheId}...`);
    const response = await this.fetchWithPay(`${this.brokerUrl}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        taskType: "cache",
        provider: "xcache",
        meta: {
          cacheOperation: "topup",
          cacheId
        }
      })
    });

    const data = await response.json();
    console.log("[xcache-client] Cache topped up:", data);
    return data;
  }

  /**
   * Set a key in the cache (direct API call)
   */
  async setKey(cacheId: string, key: string, value: any, ttl?: number) {
    console.log(`\n[xcache-client] Setting key '${key}' in cache ${cacheId}...`);
    const url = ttl
      ? `${this.xcacheApiUrl}/${cacheId}/${key}?ttl=${ttl}`
      : `${this.xcacheApiUrl}/${cacheId}/${key}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(value)
    });

    const data = await response.json();
    console.log("[xcache-client] Key set:", data);
    return data;
  }

  /**
   * Get a key from the cache (direct API call)
   */
  async getKey(cacheId: string, key: string) {
    console.log(`\n[xcache-client] Getting key '${key}' from cache ${cacheId}...`);
    const response = await fetch(`${this.xcacheApiUrl}/${cacheId}/${key}`, {
      method: "GET"
    });

    const data = await response.json();
    console.log("[xcache-client] Key retrieved:", data);
    return data;
  }

  /**
   * Delete a key from the cache (direct API call)
   */
  async deleteKey(cacheId: string, key: string) {
    console.log(`\n[xcache-client] Deleting key '${key}' from cache ${cacheId}...`);
    const response = await fetch(`${this.xcacheApiUrl}/${cacheId}/${key}`, {
      method: "DELETE"
    });

    const data = await response.json();
    console.log("[xcache-client] Key deleted:", data);
    return data;
  }

  /**
   * List all keys in the cache (direct API call)
   */
  async listKeys(cacheId: string) {
    console.log(`\n[xcache-client] Listing keys in cache ${cacheId}...`);
    const response = await fetch(`${this.xcacheApiUrl}/${cacheId}`, {
      method: "GET"
    });

    const data = await response.json();
    console.log("[xcache-client] Keys listed:", data);
    return data;
  }

  /**
   * Get TTL for a key (direct API call)
   */
  async getTTL(cacheId: string, key: string) {
    console.log(`\n[xcache-client] Getting TTL for key '${key}' in cache ${cacheId}...`);
    const response = await fetch(`${this.xcacheApiUrl}/${cacheId}/${key}/ttl`, {
      method: "GET"
    });

    const data = await response.json();
    console.log("[xcache-client] TTL retrieved:", data);
    return data;
  }

  /**
   * Update TTL for a key (direct API call)
   */
  async updateTTL(cacheId: string, key: string, ttl: number) {
    console.log(`\n[xcache-client] Updating TTL for key '${key}' in cache ${cacheId}...`);
    const response = await fetch(`${this.xcacheApiUrl}/${cacheId}/${key}/ttl?ttl=${ttl}`, {
      method: "PUT"
    });

    const data = await response.json();
    console.log("[xcache-client] TTL updated:", data);
    return data;
  }
}

// Demo usage
async function runXCacheDemo() {
  const xcacheClient = new XCacheClient(fetchWithPay as any, BROKER_URL, XCACHE_API_URL);

  try {
    // 1. Create a new cache
    const createResult = await xcacheClient.createCache("us-east-1");
    const cacheId = createResult.result?.jobId;

    if (!cacheId) {
      console.error("Failed to get cacheId from create response");
      return;
    }

    // 2. Set some keys
    await xcacheClient.setKey(cacheId, "user:123", { name: "Alice", age: 30 }, 3600);
    await xcacheClient.setKey(cacheId, "config:theme", { mode: "dark", color: "blue" });

    // 3. Get a key
    await xcacheClient.getKey(cacheId, "user:123");

    // 4. List all keys
    await xcacheClient.listKeys(cacheId);

    // 5. Get TTL
    await xcacheClient.getTTL(cacheId, "user:123");

    // 6. Update TTL
    await xcacheClient.updateTTL(cacheId, "user:123", 7200);

    // 7. Delete a key
    await xcacheClient.deleteKey(cacheId, "config:theme");

    // 8. List keys again to see the deletion
    await xcacheClient.listKeys(cacheId);

    console.log("\n✅ XCache demo completed successfully!");
  } catch (error) {
    console.error("\n❌ XCache demo failed:", error);
  }
}

// Run the demo
runXCacheDemo();
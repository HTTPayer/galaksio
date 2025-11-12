/**
 * Test client for the Galaksio Executor
 *
 * This demonstrates how to send tasks to the executor
 */

import axios from "axios";

const EXECUTOR_URL = "http://localhost:8090";

async function testXCacheCreate() {
  console.log("\n=== Test 1: Create xcache ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-create-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "create",
      cacheRegion: "us-east-1",
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
    return response.data.result.cacheId;
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
    return null;
  }
}

async function testXCacheSet(cacheId: string) {
  console.log("\n=== Test 2: Set key in xcache ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-set-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "set",
      cacheId,
      cacheKey: "user:123",
      cacheValue: {
        name: "Alice",
        email: "alice@example.com",
      },
      cacheTtl: 3600,
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

async function testXCacheGet(cacheId: string) {
  console.log("\n=== Test 3: Get key from xcache ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-get-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "get",
      cacheId,
      cacheKey: "user:123",
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

async function testXCacheList(cacheId: string) {
  console.log("\n=== Test 4: List keys in xcache ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-list-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "list",
      cacheId,
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

async function testXCacheGetTTL(cacheId: string) {
  console.log("\n=== Test 5: Get TTL for key ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-ttl-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "ttl",
      cacheId,
      cacheKey: "user:123",
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

async function testXCacheUpdateTTL(cacheId: string) {
  console.log("\n=== Test 6: Update TTL for key ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-update-ttl-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "update-ttl",
      cacheId,
      cacheKey: "user:123",
      cacheTtl: 7200,
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

async function testXCacheDelete(cacheId: string) {
  console.log("\n=== Test 7: Delete key from xcache ===");
  try {
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      jobId: "test-delete-1",
      taskType: "cache",
      provider: "xcache",
      cacheOperation: "delete",
      cacheId,
      cacheKey: "user:123",
    });
    console.log("✓ Success:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

async function runTests() {
  console.log("Testing Galaksio Executor with xcache provider");
  console.log("==============================================");

  // Check health
  try {
    const health = await axios.get(`${EXECUTOR_URL}/health`);
    console.log("✓ Executor is healthy:", health.data);
  } catch (error: any) {
    console.error("✗ Executor is not running. Start it with: npm run dev");
    return;
  }

  // Run all tests
  const cacheId = await testXCacheCreate();
  if (!cacheId) {
    console.error("\n✗ Could not create cache. Aborting tests.");
    return;
  }

  await testXCacheSet(cacheId);
  await testXCacheGet(cacheId);
  await testXCacheList(cacheId);
  await testXCacheGetTTL(cacheId);
  await testXCacheUpdateTTL(cacheId);
  await testXCacheDelete(cacheId);

  console.log("\n==============================================");
  console.log("Tests completed!");
}

runTests().catch(console.error);

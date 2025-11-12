import { config } from "dotenv";
import { createHTTPayerClient } from "../client/httpayer.js";

// Load environment variables
config();

/**
 * Test script for E2B execute endpoint using HTTPayer client
 * Sends a "hello world" Python script through the httpayer proxy
 */

const ENDPOINT_URL = 'https://echo.router.merit.systems/resource/e2b/execute';

interface ExecuteRequest {
  snippet: string;
}

interface ExecuteResponse {
  // Add expected response fields based on your API
  result?: string;
  output?: string;
  error?: string;
  [key: string]: any;
}

async function testE2BEndpoint() {
  console.log('Testing E2B execute endpoint using HTTPayer...');
  console.log(`Endpoint: ${ENDPOINT_URL}`);
  console.log(`Router: ${process.env.HTTPAYER_ROUTER_URL || 'http://localhost:3000'}\n`);

  // Create HTTPayer client from environment variables
  const client = createHTTPayerClient();

  const payload: ExecuteRequest = {
    snippet: 'print("Hello World!")'
  };

  try {
    console.log('Sending request with payload:', JSON.stringify(payload, null, 2));

    // Use HTTPayer client to make the request
    // This will automatically handle 402 payment challenges
    const response = await client.post<ExecuteResponse>(
      ENDPOINT_URL,
      payload
    );

    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('\n❌ Request failed:');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }

    console.error('Error:', error.message);
    throw error;
  }
}

// Run the test
testE2BEndpoint()
  .then(() => {
    console.log('\n✓ Test complete.');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n✗ Test failed.');
    process.exit(1);
  });

# Galaksio Client Integration Guide

This guide explains how clients send requests to the Galaksio broker, which then handles payment verification and forwards tasks to the executor.

## Architecture Flow

```
Client → Broker → Quote Engine
              ↓
            Executor → HTTPayer → Pinata/Providers
```

## Two Integration Methods

### Method 1: Direct `/run` Endpoint (with x402 Payment)

This is the simpler approach using the x402 payment protocol.

#### Step 1: First Request (No Payment)

The client makes a request without payment to discover payment requirements:

```bash
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "storage",
    "fileUrl": "https://example.com/myfile.pdf",
    "provider": "pinata",
    "meta": {
      "name": "myfile.pdf"
    }
  }'
```

**Response (402 Payment Required):**
```json
{
  "x402Version": "0.1",
  "accepts": [
    {
      "scheme": "exact",
      "network": "base-sepolia",
      "payTo": "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
      "asset": "USDC",
      "maxAmountRequired": "1000000",
      "resource": "/run",
      "description": "Payment required to execute task",
      "mimeType": "application/json",
      "maxTimeoutSeconds": 300
    }
  ]
}
```

#### Step 2: Make Payment On-Chain

The client pays 1 USDC (6 decimals = 1000000) to the broker wallet on Base Sepolia.

#### Step 3: Retry with Payment Proof

```bash
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -H "x-payment: <base64-encoded-payment-proof>" \
  -d '{
    "taskType": "storage",
    "fileUrl": "https://example.com/myfile.pdf",
    "provider": "pinata",
    "meta": {
      "name": "myfile.pdf"
    }
  }'
```

The `x-payment` header contains a base64-encoded JSON payload with proof of payment (transaction hash, etc.).

**Success Response (200):**
```json
{
  "jobId": "job-123abc",
  "status": "completed",
  "result": {
    "jobId": "job-123abc",
    "status": "completed",
    "result": {
      "cid": "QmXxxx...",
      "url": "https://gateway.pinata.cloud/ipfs/QmXxxx..."
    }
  }
}
```

---

### Method 2: A2A Protocol (Agent-to-Agent)

This method uses the Agent-to-Agent (A2A) protocol for structured negotiation.

#### Step 1: Send Task Request

```bash
curl -X POST http://localhost:8080/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task_request",
    "agent_id": "client-agent-123",
    "a2a_version": "1.0",
    "payload": {
      "taskType": "storage",
      "fileUrl": "https://example.com/myfile.pdf",
      "provider": "pinata",
      "meta": {
        "name": "myfile.pdf"
      }
    }
  }'
```

**Response (402 Payment Required):**
```json
{
  "type": "payment_required",
  "agent_id": "galaksio-broker",
  "payload": {
    "accepts": [
      {
        "scheme": "exact",
        "network": "base-sepolia",
        "payTo": "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
        "asset": "USDC",
        "maxAmountRequired": "1000000000000000",
        "description": "Pay to run requested task"
      }
    ]
  },
  "meta": {
    "jobId": "job-456def"
  }
}
```

#### Step 2: Make Payment

Pay to the specified wallet address on Base Sepolia.

#### Step 3: Submit to `/run` with Payment

After payment, use the `/run` endpoint with the `x-payment` header as shown in Method 1.

---

## Request Payload Structure

### RunTaskPayload

```typescript
{
  taskType: "storage" | "compute",
  fileUrl?: string,           // URL to file to process
  fileInline?: string,        // Base64 encoded file content
  language?: "python" | "node" | "bash",  // For compute tasks
  dependencies?: string[],    // For compute tasks
  provider?: string,          // e.g., "pinata" (optional, broker will choose best)
  maxCostUsd?: number,        // Maximum willing to pay
  meta?: {
    name?: string,            // File name
    [key: string]: any        // Additional metadata
  }
}
```

---

## Complete Flow with Payment

### What Happens After Client Sends Request with Payment:

1. **Client → Broker**: POST `/run` with `x-payment` header
2. **Broker validates payment** using x402 SDK (`verify()`)
3. **Broker creates job** in database (status: "queued")
4. **Broker → Quote Engine**: Requests best quote for provider
5. **Quote Engine → Broker**: Returns quote with price and availability
6. **Broker updates job** (status: "running", adds quote)
7. **Broker → Executor**: POST `/execute` with task details
8. **Executor → HTTPayer**: Requests presigned upload URL
9. **HTTPayer → Pinata**: Proxies request with payment
10. **Executor uploads file** to Pinata
11. **Executor → Broker**: Returns result (CID, URL, etc.)
12. **Broker updates job** (status: "completed", adds result)
13. **Broker → Client**: Returns final result

---

## Testing Without Payment (Development)

For development/testing, you can temporarily disable payment verification:

1. Comment out the `enforceX402` middleware in `broker/src/routes/job.ts`:

```typescript
// router.post("/run", enforceX402, async (req, res) => {
router.post("/run", async (req, res) => {
```

2. Then you can test directly:

```bash
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "storage",
    "fileUrl": "https://example.com/test.pdf",
    "provider": "pinata",
    "meta": {
      "name": "test.pdf"
    }
  }'
```

---

## Example Use Cases

### 1. Upload File to IPFS via Pinata

```json
{
  "taskType": "storage",
  "fileUrl": "https://my-cdn.com/document.pdf",
  "provider": "pinata",
  "meta": {
    "name": "important-document.pdf"
  }
}
```

### 2. Compute Task (Future)

```json
{
  "taskType": "compute",
  "fileInline": "cHJpbnQoJ0hlbGxvIFdvcmxkJyk=",
  "language": "python",
  "dependencies": ["numpy", "pandas"],
  "meta": {
    "name": "data-analysis.py"
  }
}
```

---

## Monitoring Job Status

You can check job status at any time:

```bash
curl http://localhost:8080/status/{jobId}
```

**Response:**
```json
{
  "id": "job-123abc",
  "requester": "0xClientWallet",
  "status": "completed",
  "quote": {
    "provider": "pinata",
    "priceUsd": 0.001,
    "estimatedDuration": 5,
    "available": true
  },
  "provider": "pinata",
  "result": {
    "jobId": "job-123abc",
    "status": "completed",
    "result": {
      "cid": "QmXxxx...",
      "url": "https://gateway.pinata.cloud/ipfs/QmXxxx..."
    }
  }
}
```

---

## Environment Setup

### Broker (.env)
```bash
PORT=8080
QUOTE_ENGINE_URL=http://localhost:4284
EXECUTOR_URL=http://localhost:8090
BROKER_WALLET=0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F
```

### Executor (.env)
```bash
PORT=8090
X402_ROUTER_URL=http://localhost:8080
HTTPAYER_API_KEY=your-httpayer-api-key
PINATA_BASE=https://402.pinata.cloud/v1
```

---

## Error Handling

### Common Errors

| Status | Error | Meaning |
|--------|-------|---------|
| 402 | Payment Required | No payment header or payment verification failed |
| 400 | Bad Request | Invalid payload structure |
| 404 | Not Found | Job ID doesn't exist |
| 500 | Internal Server Error | Quote engine failure, executor failure, or other internal error |

---

## Next Steps

1. Set up a wallet on Base Sepolia
2. Fund with test USDC
3. Implement x402 payment flow in your client
4. Test with broker running on `localhost:8080`

For a full client SDK implementation, see `/examples/` directory (coming soon).

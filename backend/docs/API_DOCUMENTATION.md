# Galaksio Broker API Documentation

## Overview

The Galaksio Broker is a payment-gated orchestration service that provides distributed compute and storage services via the X402 micropayment protocol. It automatically selects the best provider based on pricing and routes tasks to appropriate executors.

## Quick Start

### Starting the Broker

```bash
cd broker
npm install
npm run dev
```

The broker will start on port 3000 (configurable via environment variables).

### Accessing API Documentation

Once the broker is running, visit:

- **Interactive API Docs**: http://localhost:3000/docs
- **OpenAPI JSON Spec**: http://localhost:3000/openapi.json

## API Endpoints

### 1. Health Check

**Endpoint**: `GET /health`
**Authentication**: None required
**Description**: Check if the broker service is running

**Example Request**:
```bash
curl http://localhost:3000/health
```

**Example Response**:
```json
{
  "ok": true,
  "service": "galaksio-broker",
  "version": "2.0.0",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

---

### 2. Store File

**Endpoint**: `POST /store`
**Authentication**: X402 Payment Required
**Description**: Store a file on decentralized storage (IPFS or Arweave)

#### Request Body

```json
{
  "data": "SGVsbG8gV29ybGQh",  // base64-encoded file or raw string
  "filename": "hello.txt",      // optional
  "options": {
    "permanent": false,         // true = Arweave, false = IPFS
    "ttl": 3600                 // time-to-live in seconds (for IPFS)
  }
}
```

#### Payment Flow

**Step 1**: Initial Request (without payment)
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -H "x-wallet: 0xYourWalletAddress" \
  -d '{
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }'
```

**Response (402 Payment Required)**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "xcache",
  "price_usd": 0.001,
  "file_size_bytes": 1024,
  "payment": {
    "method": "crypto",
    "address": "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
    "amount": "0.001",
    "currency": "USDC",
    "network": "base-sepolia"
  }
}
```

**Step 2**: Submit payment via X402 protocol (handled by x402-express middleware)

**Step 3**: Automatic completion after payment verification

**Success Response (200)**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "cid": "QmXxxx...",
    "url": "https://ipfs.io/ipfs/QmXxxx...",
    "provider": "xcache",
    "size": 1024
  }
}
```

#### Storage Providers

- **IPFS** (xcache): Temporary storage, lower cost, configurable TTL
- **Arweave**: Permanent storage, higher cost, one-time payment
- **xCache**: Hybrid caching layer with intelligent routing

---

### 3. Execute Code

**Endpoint**: `POST /run`
**Authentication**: X402 Payment Required
**Description**: Execute code in a sandboxed environment

#### Request Body

```json
{
  "code": "print('Hello from Galaksio!')",
  "language": "python"  // python, javascript, or bash
}
```

#### Payment Flow

**Step 1**: Initial Request
```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -H "x-wallet: 0xYourWalletAddress" \
  -d '{
    "code": "print(\"Hello from Galaksio!\")",
    "language": "python"
  }'
```

**Response (402 Payment Required)**:
```json
{
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "provider": "merit-systems",
  "price_usd": 0.0001,
  "code_size_bytes": 256,
  "payment": {
    "method": "crypto",
    "address": "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
    "amount": "0.0001",
    "currency": "USDC"
  }
}
```

**Success Response (200)** (after payment):
```json
{
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "result": {
    "stdout": "Hello from Galaksio!\n",
    "stderr": "",
    "exitCode": 0,
    "executionTime": 123
  }
}
```

#### Supported Languages

- **Python**: Default, most common use case
- **JavaScript/Node.js**: For Node.js code execution
- **Bash**: For shell scripts

#### Execution Limits

- **Timeout**: 60 seconds
- **Memory**: 512MB
- **Network**: Disabled in sandbox
- **Disk**: Ephemeral storage only

---

### 4. Get Job Status

**Endpoint**: `GET /status/:id`
**Authentication**: None required
**Description**: Retrieve the status of a previously submitted job

**Example Request**:
```bash
curl http://localhost:3000/status/550e8400-e29b-41d4-a716-446655440000
```

**Example Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "requester": "0xYourWalletAddress",
  "status": "completed",
  "provider": "xcache",
  "quote": {
    "provider": "xcache",
    "price_usd": 0.001
  },
  "result": {
    "cid": "QmXxxx...",
    "url": "https://ipfs.io/ipfs/QmXxxx..."
  },
  "createdAt": "2025-01-11T12:00:00.000Z",
  "updatedAt": "2025-01-11T12:00:05.000Z"
}
```

#### Job Statuses

- `awaiting_payment`: Job created, waiting for initial quote
- `payment_required`: Quote received, payment needed
- `running`: Payment verified, job executing
- `completed`: Job finished successfully
- `failed`: Job failed with error

---

## X402 Payment Protocol

All endpoints (except `/health` and `/status/:id`) require payment via the X402 protocol.

### Payment Workflow

1. **Initial Request**: Client sends request without payment
2. **402 Response**: Server responds with payment requirements
3. **Payment Submission**: Client submits payment via X402 facilitator
4. **Automatic Re-processing**: Middleware verifies payment and re-processes request
5. **Result**: Client receives the result in the response

### Payment Details

- **Receiver Wallet**: `0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F`
- **Facilitator**: `https://x402.org/facilitator`
- **Pricing**: Dynamic, based on task requirements
- **Network**: Base Sepolia (testnet) or Base (mainnet)
- **Currency**: USDC

### Optional Headers

- `x-wallet`: Your wallet address for tracking and identification

---

## Provider Information

### Storage Providers

| Provider | Type | Permanence | Cost | Best For |
|----------|------|------------|------|----------|
| IPFS | Distributed | Temporary | Low | Quick sharing, temporary files |
| Arweave | Blockchain | Permanent | High | Archives, permanent records |
| xCache | Hybrid | Configurable | Variable | General purpose, caching |

### Compute Providers

| Provider | Services | Languages | Cost |
|----------|----------|-----------|------|
| Merit Systems | Sandboxed execution | Python, JS, Bash | Per-execution |

---

## Error Responses

### 400 Bad Request
Missing required fields or invalid input
```json
{
  "error": "data is required"
}
```

### 402 Payment Required
Payment needed to proceed (normal flow)
```json
{
  "jobId": "...",
  "price_usd": 0.001,
  "payment": { ... }
}
```

### 404 Not Found
Job ID not found
```json
{
  "error": "not-found"
}
```

### 500 Internal Server Error
Execution or system error
```json
{
  "error": "Execution failed: timeout exceeded"
}
```

### 503 Service Unavailable
No providers available
```json
{
  "error": "No providers available"
}
```

---

## Example Usage

### Store a File (Python)

```python
import requests
import base64

# Encode file
with open('myfile.txt', 'rb') as f:
    data = base64.b64encode(f.read()).decode()

# Submit storage request
response = requests.post('http://localhost:3000/store', json={
    'data': data,
    'filename': 'myfile.txt',
    'options': {
        'permanent': False,
        'ttl': 86400  # 24 hours
    }
}, headers={
    'x-wallet': '0xYourWalletAddress'
})

if response.status_code == 402:
    # Handle payment
    payment_info = response.json()
    print(f"Payment required: ${payment_info['price_usd']}")
    # Submit payment via X402 protocol
    # ...
else:
    # File stored
    result = response.json()
    print(f"File stored at: {result['result']['url']}")
```

### Execute Code (JavaScript)

```javascript
const axios = require('axios');

async function runCode(code, language = 'python') {
  try {
    const response = await axios.post('http://localhost:3000/run', {
      code,
      language
    }, {
      headers: {
        'x-wallet': '0xYourWalletAddress'
      }
    });

    if (response.status === 402) {
      // Handle payment
      console.log('Payment required:', response.data.price_usd);
      // Submit payment via X402
      // ...
    } else {
      // Code executed
      console.log('Output:', response.data.result.stdout);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

runCode('print("Hello, World!")');
```

### Check Job Status (cURL)

```bash
#!/bin/bash

JOB_ID="550e8400-e29b-41d4-a716-446655440000"

while true; do
  STATUS=$(curl -s http://localhost:3000/status/$JOB_ID | jq -r '.status')
  echo "Job status: $STATUS"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    curl -s http://localhost:3000/status/$JOB_ID | jq '.'
    break
  fi

  sleep 2
done
```

---

## Configuration

### Environment Variables

Create a `.env` file in the broker directory:

```env
# Server Configuration
PORT=3000

# Service URLs
QUOTE_ENGINE_URL=http://localhost:8081
EXECUTOR_URL=http://localhost:3001

# X402 Payment
BROKER_WALLET=0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F
X402_FACILITATOR_URL=https://x402.org/facilitator

# Logging
LOG_LEVEL=info
```

---

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Running Tests

```bash
npm test
```

---

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/yourusername/galaksio
- Documentation: http://localhost:3000/docs

---

## License

MIT

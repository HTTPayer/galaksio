# Galaksio Broker

A TypeScript-based broker service that implements Google's Agent-to-Agent (A2A) interface with x402 payment gating. The broker orchestrates job execution by getting quotes from a quote engine and dispatching work to executor services.

## Features

- **A2A Protocol Support**: Implements Google's Agent-to-Agent communication protocol
- **X402 Payment Gating**: Uses the official x402 protocol for payment verification
- **Quote Engine Integration**: Fetches best quotes from your quote engine service
- **Executor Integration**: Dispatches jobs to executor services
- **Job Management**: In-memory job tracking with status updates
- **Structured Logging**: Centralized logging for monitoring and debugging

## Architecture

```
Client → Broker (A2A + X402) → Quote Engine
                              ↓
                          Executor Service
```

### Components

- **A2A Message Handler** (`/a2a/message`): Handles agent-to-agent communication
- **Job Execution Endpoint** (`/run`): Executes tasks after payment verification
- **Status Endpoint** (`/status/:id`): Query job status
- **Health Check** (`/health`): Service health monitoring

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8080
DEBUG=false

# Wallet Configuration
BROKER_WALLET=0xYourWalletAddressHere

# Service URLs
QUOTE_ENGINE_URL=http://localhost:8081
EXECUTOR_URL=http://localhost:8082
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `BROKER_WALLET` | Wallet address for receiving payments | Required |
| `QUOTE_ENGINE_URL` | URL of the quote engine service | `http://localhost:8081` |
| `EXECUTOR_URL` | URL of the executor service | `http://localhost:8082` |
| `DEBUG` | Enable debug logging | `false` |

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns service health status.

**Response:**
```json
{
  "ok": true,
  "service": "galaksio-broker",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### A2A Message Endpoint

```
POST /a2a/message
```

Handles Agent-to-Agent protocol messages.

**Request Body (A2A Envelope):**
```json
{
  "type": "task_request",
  "agent_id": "client-agent-123",
  "a2a_version": "0.1",
  "payload": {
    "taskType": "compute",
    "language": "python",
    "fileUrl": "https://example.com/script.py"
  },
  "meta": {}
}
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
        "payTo": "0xBrokerWalletAddress",
        "asset": "USDC",
        "maxAmountRequired": "1000000",
        "description": "Pay to run requested task"
      }
    ]
  },
  "meta": {
    "jobId": "job-uuid-here"
  }
}
```

### Execute Job

```
POST /run
```

Executes a task after payment verification. Requires `X-Payment` header with payment proof.

**Headers:**
```
X-Payment: <base64-encoded-payment-proof>
Content-Type: application/json
```

**Request Body:**
```json
{
  "taskType": "compute",
  "language": "python",
  "fileUrl": "https://example.com/script.py",
  "dependencies": ["numpy", "pandas"],
  "provider": "aws",
  "maxCostUsd": 10
}
```

**Response (Success):**
```json
{
  "jobId": "job-uuid",
  "status": "completed",
  "result": {
    "output": "task execution output",
    "executionTime": 1234
  }
}
```

**Response (Payment Required - 402):**
```json
{
  "x402Version": "0.1",
  "accepts": [
    {
      "scheme": "exact",
      "network": "base-sepolia",
      "payTo": "0xBrokerWalletAddress",
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

### Job Status

```
GET /status/:jobId
```

Query the status of a job by ID.

**Response:**
```json
{
  "id": "job-uuid",
  "requester": "client-agent-123",
  "status": "completed",
  "provider": "aws",
  "quote": {
    "provider": "aws",
    "priceUsd": 0.50,
    "estimatedDuration": 120
  },
  "result": {
    "output": "..."
  },
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:32:00.000Z"
}
```

## X402 Payment Protocol

The broker implements the [x402 payment protocol](https://github.com/coinbase/x402) for payment gating.

### How it Works

1. **Client makes request** without payment → Receives 402 with payment requirements
2. **Client creates payment** using x402-fetch or manual implementation
3. **Client retries request** with `X-Payment` header
4. **Broker verifies payment** using x402 SDK
5. **Job is executed** if payment is valid

### Client Integration

#### Using x402-fetch (Recommended)

```typescript
import { wrapFetchWithPayment } from "x402-fetch";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Setup wallet
const account = privateKeyToAccount("0xYourPrivateKey");
const client = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

// Wrap fetch with automatic payment handling
const fetchWithPay = wrapFetchWithPayment(fetch, client);

// Make request (payment handled automatically on 402)
const response = await fetchWithPay("http://localhost:8080/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    taskType: "compute",
    language: "python",
    fileUrl: "https://example.com/script.py"
  })
});

const result = await response.json();
```

#### Manual Integration

See the [x402 documentation](https://github.com/coinbase/x402) for manual client integration.

## Task Types

### Compute Tasks

Execute code in various languages:

```json
{
  "taskType": "compute",
  "language": "python",
  "fileUrl": "https://example.com/script.py",
  "dependencies": ["numpy"]
}
```

### Storage Tasks

Store and retrieve data:

```json
{
  "taskType": "storage",
  "provider": "aws-s3",
  "maxCostUsd": 5
}
```

## Development

### Project Structure

```
broker/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── routes/
│   │   └── job.ts            # Job-related routes
│   ├── middleware/
│   │   ├── a2a.ts            # A2A envelope parser
│   │   └── x402.ts           # X402 payment verification
│   ├── services/
│   │   ├── quoteClient.ts    # Quote engine integration
│   │   └── executorClient.ts # Executor service integration
│   ├── db/
│   │   └── jobStore.ts       # In-memory job storage
│   └── utils/
│       ├── config.ts         # Configuration management
│       └── logger.ts         # Logging utilities
├── package.json
├── tsconfig.json
└── .env
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

## Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8080/health

# A2A message (will return 402)
curl -X POST http://localhost:8080/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task_request",
    "agent_id": "test-agent",
    "payload": {
      "taskType": "compute",
      "language": "python"
    }
  }'

# Run job (will return 402 without payment)
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "compute",
    "language": "python",
    "fileUrl": "https://example.com/script.py"
  }'
```

## Dependencies

### Core Dependencies

- **express** - Web framework
- **x402** - Payment protocol verification
- **x402-fetch** - Client-side payment handling
- **axios** - HTTP client
- **dotenv** - Environment configuration
- **uuid** - Unique ID generation

### Dev Dependencies

- **typescript** - TypeScript compiler
- **ts-node-dev** - Development server with hot reload
- **@types/*** - TypeScript type definitions

## Security Considerations

- **Private Keys**: Never commit private keys or wallet credentials
- **Environment Variables**: Use `.env` for sensitive configuration
- **Payment Verification**: Always verify payments on-chain before execution
- **Rate Limiting**: Consider adding rate limiting for production use
- **HTTPS**: Use HTTPS in production environments

## Troubleshooting

### Common Issues

**"Payment verification failed"**
- Ensure BROKER_WALLET is correctly configured
- Check that the payment network matches (base-sepolia)
- Verify the payment amount meets requirements

**"quote-fetch-failed"**
- Ensure QUOTE_ENGINE_URL is accessible
- Check that the quote engine is running
- Verify network connectivity

**"executor-failed"**
- Ensure EXECUTOR_URL is accessible
- Check that the executor service is running
- Review executor logs for errors

## License

Apache-2.0

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- Tests pass
- Documentation is updated

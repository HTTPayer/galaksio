# Galaksio Executor (TypeScript)

TypeScript implementation of the Galaksio Executor with built-in HTTPayer integration for handling 402 payment-gated APIs.

## Features

- **HTTPayer Integration**: Automatic handling of 402 payment challenges
- **xcache Provider**: Full support for xcache.io Redis-compatible caching operations
- **Extensible Architecture**: Easy to add new providers and task types
- **TypeScript**: Full type safety and excellent developer experience

## Architecture

The executor receives tasks from the broker, routes them to appropriate providers (starting with xcache), and handles payment requirements automatically via HTTPayer.

### Components

- **src/index.ts**: Express server that receives tasks from the broker
- **src/types.ts**: TypeScript type definitions for Task, ExecutorResponse, etc.
- **src/client/httpayer.ts**: HTTPayer client with 402 payment challenge handling
- **src/handlers/xcache.ts**: Handler for xcache operations

## Supported Providers

### xcache (Cache Provider)

Full implementation of xcache.io API operations:

- **create**: Create a new cache instance
- **get**: Retrieve a cached value by key
- **set**: Store a value with optional TTL
- **delete**: Remove a key from cache
- **list**: List all keys in a cache
- **ttl**: Get time-to-live for a key
- **update-ttl**: Update expiration time for a key

## API

### POST /execute

Execute a task based on the provided payload.

#### Example: Create xcache

```json
{
  "jobId": "uuid-1234",
  "taskType": "cache",
  "provider": "xcache",
  "cacheOperation": "create",
  "cacheRegion": "us-east-1"
}
```

**Response:**
```json
{
  "jobId": "uuid-1234",
  "status": "completed",
  "result": {
    "cacheId": "96ad0856-03b1-4ee7-9666-e81abd0349e1",
    "region": "us-east-1"
  }
}
```

#### Example: Set Key in xcache

```json
{
  "jobId": "uuid-5678",
  "taskType": "cache",
  "provider": "xcache",
  "cacheOperation": "set",
  "cacheId": "96ad0856-03b1-4ee7-9666-e81abd0349e1",
  "cacheKey": "user:123",
  "cacheValue": {
    "name": "Alice",
    "email": "alice@example.com"
  },
  "cacheTtl": 3600
}
```

**Response:**
```json
{
  "jobId": "uuid-5678",
  "status": "completed",
  "result": {
    "key": "user:123",
    "value": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "ttl": 3600
  }
}
```

#### Example: Get Key from xcache

```json
{
  "jobId": "uuid-9999",
  "taskType": "cache",
  "provider": "xcache",
  "cacheOperation": "get",
  "cacheId": "96ad0856-03b1-4ee7-9666-e81abd0349e1",
  "cacheKey": "user:123"
}
```

**Response:**
```json
{
  "jobId": "uuid-9999",
  "status": "completed",
  "result": {
    "key": "user:123",
    "value": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "ttl": 3455
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "service": "galaksio-executor",
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Executor Configuration
PORT=8090

# HTTPayer Router Configuration
HTTPAYER_ROUTER_URL=http://localhost:3000
HTTPAYER_API_KEY=your-httpayer-api-key-here

# Optional: Private key for automatic payment handling
EXECUTOR_PRIVATE_KEY=0x...
```

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

The executor listens on port **8090** by default (configurable via `PORT` environment variable).

## HTTPayer Integration

The HTTPayer client automatically detects and handles 402 Payment Required responses:

1. Request is sent through HTTPayer proxy
2. If 402 response is received, payment details are extracted
3. Payment information is logged and error is thrown with details
4. (Future) Automatic payment execution using executor wallet

### Example 402 Handling

When a request requires payment:

```
[httpayer] Received 402 Payment Required
[httpayer] Payment required: 1000000000000000 to 0x...
[httpayer] Network: base-sepolia
[httpayer] Asset: 0x036CbD53842c5426634e7929541eC2318b4c2C8F
```

## Integration with Broker

The broker calls the executor at the URL specified in `EXECUTOR_URL` environment variable:

```typescript
// broker/src/services/executorClient.ts
await axios.post(`${config.executorUrl}/execute`, {
  jobId: req.jobId,
  taskType: "cache",
  provider: "xcache",
  cacheOperation: "set",
  cacheId: "...",
  cacheKey: "user:123",
  cacheValue: { name: "Alice" },
  cacheTtl: 3600
});
```

## Task Types

### Cache Tasks

```typescript
{
  taskType: "cache",
  provider: "xcache",
  cacheOperation: "get" | "set" | "delete" | "list" | "ttl" | "update-ttl" | "create",
  cacheId?: string,
  cacheKey?: string,
  cacheValue?: any,
  cacheTtl?: number,
  cacheRegion?: string
}
```

### Storage Tasks (TODO)

Will support file storage providers like Pinata, Arweave, etc.

### Compute Tasks (TODO)

Will support code execution providers.

## Development

### Project Structure

```
executor-ts/
├── src/
│   ├── index.ts              # Main Express server
│   ├── types.ts              # TypeScript type definitions
│   ├── client/
│   │   └── httpayer.ts       # HTTPayer client with 402 handling
│   └── handlers/
│       └── xcache.ts         # xcache provider implementation
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Adding a New Provider

1. Create a handler in `src/handlers/`
2. Implement the provider logic using HTTPayerClient
3. Add the provider case in `src/index.ts`
4. Update types in `src/types.ts` if needed

### Type Checking

```bash
npm run type-check
```

## Future Enhancements

- [ ] Implement storage task handlers (Pinata, Arweave)
- [ ] Implement compute task handlers
- [ ] Automatic payment execution for 402 challenges
- [ ] Task queue for async processing
- [ ] Retry logic with exponential backoff
- [ ] Metrics and monitoring
- [ ] Support for more cache providers (Redis, Memcached)
- [ ] WebSocket support for long-running tasks

## Dependencies

- **Express**: Web server framework
- **Axios**: HTTP client for making requests
- **dotenv**: Environment variable management

## License

MIT

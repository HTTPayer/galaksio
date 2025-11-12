# Testing the Galaksio Executor

This guide walks you through testing the TypeScript executor with xcache provider.

## Prerequisites

1. **HTTPayer Router**: You'll need a running HTTPayer router instance
   - Default URL: `http://localhost:3000`
   - Configure in `.env`: `HTTPAYER_ROUTER_URL`

2. **HTTPayer API Key**: Get an API key for the HTTPayer router
   - Configure in `.env`: `HTTPAYER_API_KEY`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your HTTPAYER_API_KEY
```

3. Start the executor:
```bash
npm run dev
```

You should see:
```
[INFO] Galaksio Executor (TypeScript) running on port 8090
[INFO] HTTPayer Router URL: http://localhost:3000
[INFO] Supported providers: xcache
```

## Running Tests

### Option 1: Use the Test Client

In a separate terminal, run the automated test client:

```bash
npm test
```

This will run through all xcache operations:
1. Create a new cache
2. Set a key with value and TTL
3. Get the key back
4. List all keys
5. Get TTL for the key
6. Update TTL
7. Delete the key

### Option 2: Manual Testing with curl

#### 1. Health Check

```bash
curl http://localhost:8090/health
```

#### 2. Create xcache

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-1",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "create",
    "cacheRegion": "us-east-1"
  }'
```

Response:
```json
{
  "jobId": "test-1",
  "status": "completed",
  "result": {
    "cacheId": "96ad0856-03b1-4ee7-9666-e81abd0349e1",
    "region": "us-east-1"
  }
}
```

**Save the `cacheId` for the next steps!**

#### 3. Set Key in Cache

Replace `CACHE_ID` with the ID from step 2:

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-2",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "set",
    "cacheId": "CACHE_ID",
    "cacheKey": "user:123",
    "cacheValue": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "cacheTtl": 3600
  }'
```

#### 4. Get Key from Cache

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-3",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "get",
    "cacheId": "CACHE_ID",
    "cacheKey": "user:123"
  }'
```

#### 5. List All Keys

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-4",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "list",
    "cacheId": "CACHE_ID"
  }'
```

#### 6. Get TTL for Key

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-5",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "ttl",
    "cacheId": "CACHE_ID",
    "cacheKey": "user:123"
  }'
```

#### 7. Update TTL

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-6",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "update-ttl",
    "cacheId": "CACHE_ID",
    "cacheKey": "user:123",
    "cacheTtl": 7200
  }'
```

#### 8. Delete Key

```bash
curl -X POST http://localhost:8090/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-7",
    "taskType": "cache",
    "provider": "xcache",
    "cacheOperation": "delete",
    "cacheId": "CACHE_ID",
    "cacheKey": "user:123"
  }'
```

## Testing 402 Payment Handling

If xcache is behind a paywall (via HTTPayer), the executor will automatically detect and log the payment requirement:

```
[httpayer] Received 402 Payment Required
[httpayer] Payment required: 1000000000000000 to 0x...
[httpayer] Network: base-sepolia
[httpayer] Asset: 0x036CbD53842c5426634e7929541eC2318b4c2C8F
```

The task will fail with details about the payment needed. In the future, automatic payment execution will be supported.

## Expected Responses

### Success Response
```json
{
  "jobId": "test-1",
  "status": "completed",
  "result": {
    // Provider-specific result data
  }
}
```

### Error Response
```json
{
  "jobId": "test-1",
  "status": "failed",
  "error": "Error message describing what went wrong"
}
```

## Debugging

### Check Executor Logs

The executor outputs detailed logs for all operations:

```
[executor] Received task - JobID: test-1, TaskType: cache, Provider: xcache
[xcache] Handling operation: create for job test-1
[httpayer] Making POST request to https://api.xcache.io/create
[httpayer] Request successful: 200
[executor] Task test-1 completed successfully
```

### Common Issues

1. **"HTTPAYER_API_KEY not set"**
   - Solution: Add your API key to `.env`

2. **"HTTPayer request failed"**
   - Check that HTTPayer router is running
   - Verify `HTTPAYER_ROUTER_URL` is correct in `.env`

3. **"Payment required"**
   - The operation requires payment via HTTPayer
   - Check payment details in the error message
   - Ensure wallet has sufficient funds

4. **"cacheId is required"**
   - You must first create a cache and use the returned `cacheId`

## Integration Testing with Broker

To test the full flow from broker → executor:

1. Start the executor: `npm run dev`
2. Start the broker: `cd ../broker && npm run dev`
3. Send a request to the broker's `/run` endpoint
4. The broker will call the executor automatically

See `../broker/README.md` for broker integration details.

## Performance Testing

For load testing, consider using tools like:
- Apache Bench: `ab -n 100 -c 10 http://localhost:8090/health`
- Artillery: For more complex scenarios
- k6: For production-like load testing

## Next Steps

- Add more providers (storage, compute)
- Implement automatic payment execution
- Add metrics and monitoring
- Create integration tests with the broker

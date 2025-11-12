# OpenX402 JSON File Upload Flow

This document explains how the Galaksio system automatically detects and handles JSON file uploads for the OpenX402 IPFS storage provider, routing them to the appropriate endpoint with optimized pricing.

## Overview

When a client uploads a `.json` file, the system automatically detects it and uses the OpenX402 `/pin/json` endpoint instead of the standard `/pin/file` endpoint. This results in a fixed cost of **0.01 USDC** for JSON uploads.

## System Architecture

```
Client → Broker → Quote Engine → Executor → OpenX402 IPFS
```

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                                │
│    POST /store                                                   │
│    {                                                             │
│      data: "base64_or_raw_json",                                │
│      filename: "data.json",                                     │
│      options: { permanent: false, ttl: 3600 }                   │
│    }                                                             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         v
┌──────────────────────────────────────────────────────────────────┐
│ 2. BROKER (broker/src/routes/store.ts)                          │
│    - Receives request with file data and filename                │
│    - Calculates file size                                        │
│    - Creates job in database                                     │
│    - Calls Quote Engine with:                                    │
│        • fileSize                                                │
│        • fileName (for JSON detection)                           │
│        • fileContent (for validation)                            │
│        • permanent/ttl options                                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         v
┌──────────────────────────────────────────────────────────────────┐
│ 3. QUOTE ENGINE (quote/main.py → galaksio/openx402.py)          │
│                                                                  │
│    POST /v2/quote/store                                          │
│    {                                                             │
│      fileSize: 1234,                                            │
│      fileName: "data.json",                                     │
│      fileContent: "...",                                        │
│      permanent: false,                                          │
│      ttl: 3600                                                  │
│    }                                                             │
│                                                                  │
│    ┌─────────────────────────────────────────────┐             │
│    │ JSON Detection Logic:                       │             │
│    │                                              │             │
│    │ 1. Check file extension (.json)             │             │
│    │ 2. Try to parse content as JSON             │             │
│    │ 3. Decode base64 if needed                  │             │
│    └─────────────────────────────────────────────┘             │
│                                                                  │
│    If JSON detected:                                             │
│      → Use https://ipfs.openx402.ai/pin/json                    │
│      → Fixed price: 0.01 USDC                                   │
│                                                                  │
│    If regular file:                                              │
│      → Use https://ipfs.openx402.ai/pin/file                    │
│      → Variable pricing based on size                           │
│                                                                  │
│    Returns quote with x402 payment instructions                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         v
┌──────────────────────────────────────────────────────────────────┐
│ 4. BROKER - Payment Check                                        │
│    - Receives quote with pricing                                 │
│    - Returns 402 Payment Required if unpaid                      │
│    - Waits for x402 payment verification                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         v (payment verified)
┌──────────────────────────────────────────────────────────────────┐
│ 5. EXECUTOR (executor/src/handlers/openx402.ts)                 │
│                                                                  │
│    Receives task with:                                           │
│    - jobId                                                       │
│    - fileInline or fileUrl                                       │
│    - meta.fileName                                               │
│    - meta.operation (default: "pin-file")                        │
│                                                                  │
│    ┌─────────────────────────────────────────────┐             │
│    │ JSON Detection Logic (same as quote):       │             │
│    │                                              │             │
│    │ 1. Check meta.fileName extension             │             │
│    │ 2. Check fileUrl extension                   │             │
│    │ 3. Try to parse fileInline as JSON           │             │
│    └─────────────────────────────────────────────┘             │
│                                                                  │
│    If JSON detected:                                             │
│      → Call pinJson()                                            │
│      → POST to /pin/json with JSON body                         │
│                                                                  │
│    If regular file:                                              │
│      → Call pinFile()                                            │
│      → POST to /pin/file with FormData                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         v
┌──────────────────────────────────────────────────────────────────┐
│ 6. OPENX402 IPFS SERVICE                                         │
│                                                                  │
│    Endpoint: /pin/json (0.01 USDC)                              │
│    POST https://ipfs.openx402.ai/pin/json                       │
│    Content-Type: application/json                               │
│    Body: { "name": "data", "value": 123 }                       │
│                                                                  │
│    OR                                                            │
│                                                                  │
│    Endpoint: /pin/file (variable pricing)                       │
│    POST https://ipfs.openx402.ai/pin/file                       │
│    Content-Type: multipart/form-data                            │
│    Body: FormData with file                                     │
│                                                                  │
│    Returns:                                                      │
│    {                                                             │
│      success: true,                                             │
│      id: "...",                                                 │
│      ipfsHash: "Qm...",                                         │
│      pinataUrl: "https://gateway.pinata.cloud/ipfs/Qm..."      │
│    }                                                             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         v
┌──────────────────────────────────────────────────────────────────┐
│ 7. EXECUTOR → BROKER → CLIENT                                    │
│    - Executor returns result to Broker                           │
│    - Broker updates job status to "completed"                    │
│    - Client receives IPFS hash and URL                           │
│                                                                  │
│    Response:                                                     │
│    {                                                             │
│      jobId: "...",                                              │
│      status: "completed",                                       │
│      result: {                                                  │
│        success: true,                                           │
│        ipfsHash: "Qm...",                                       │
│        ipfsUrl: "https://gateway.pinata.cloud/ipfs/Qm...",     │
│        endpoint: "/pin/json",                                   │
│        priceUsd: 0.01                                           │
│      }                                                           │
│    }                                                             │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Broker (broker/src/routes/store.ts)

**Role**: Entry point for client requests, orchestrates the storage flow

**Key Functions**:
- Receives file data from client (base64, raw string, or URL)
- Extracts filename for JSON detection
- Calculates file size
- Creates job in database
- Calls Quote Engine with file metadata

**Code Location**: `broker/src/routes/store.ts:33-41`

```typescript
const quotesResponse = await getStoreQuotes({
  fileSize,
  permanent: options?.permanent || false,
  ttl: options?.ttl || 3600,
  fileName: filename,        // For JSON detection
  fileContent: typeof data === "string" ? data : undefined
});
```

### 2. Quote Engine (quote/galaksio/openx402.py)

**Role**: Provides pricing quotes and detects file types

**Key Functions**:
- `detect_json_file()`: Detects JSON files by extension or content
- `get_openx402_storage_quote()`: Returns pricing based on file type

**JSON Detection Logic**:
1. Check if `fileName` ends with `.json`
2. Try to parse `fileContent` as JSON (handles base64)
3. Return appropriate endpoint and pricing

**Code Location**: `quote/galaksio/openx402.py:9-103`

**Pricing**:
- JSON files (`/pin/json`): Fixed 0.01 USDC
- Regular files (`/pin/file`): Variable based on size

### 3. Executor (executor/src/handlers/openx402.ts)

**Role**: Executes the actual storage operation

**Key Functions**:
- `detectJsonFile()`: Mirrors quote engine detection logic
- `pinJson()`: Handles JSON uploads to `/pin/json`
- `pinFile()`: Handles regular file uploads to `/pin/file`

**Code Location**: `executor/src/handlers/openx402.ts:44-137`

**JSON Handling**:
```typescript
// Detect JSON file
const isJsonFile = detectJsonFile(task);

if (isJsonFile) {
  // Parse JSON and POST to /pin/json
  return await pinJson(jobId, httpayer, task);
} else {
  // Upload as FormData to /pin/file
  return await pinFile(jobId, httpayer, task);
}
```

## JSON Detection Strategy

The system uses a multi-layered approach to detect JSON files:

### 1. Filename Extension Check
```typescript
// TypeScript (Executor)
if (fileName && fileName.toLowerCase().endsWith('.json')) {
  return true;
}
```

```python
# Python (Quote Engine)
if file_name and file_name.lower().endswith('.json'):
    return True
```

### 2. URL Extension Check
```typescript
if (task.fileUrl && task.fileUrl.toLowerCase().endsWith('.json')) {
  return true;
}
```

### 3. Content Validation
```typescript
// Try to parse the content as JSON
try {
  let content = Buffer.from(task.fileInline, 'base64').toString('utf-8');
  JSON.parse(content);
  return true;
} catch {
  return false;
}
```

```python
# Python equivalent
try:
    decoded = base64.b64decode(file_content).decode('utf-8')
    json.loads(decoded)
    return True
except:
    return False
```

## API Endpoints

### OpenX402 Endpoints

#### 1. JSON Upload (0.01 USDC)
```bash
curl -X POST https://ipfs.openx402.ai/pin/json \
  -H "Content-Type: application/json" \
  -d '{"name": "My Data", "value": 123}'
```

**Response**:
```json
{
  "success": true,
  "id": "unique-id",
  "ipfsHash": "QmXxx...",
  "pinataUrl": "https://gateway.pinata.cloud/ipfs/QmXxx..."
}
```

#### 2. File Upload (Variable Pricing)
```bash
curl -X POST https://ipfs.openx402.ai/pin/file \
  -F "file=@myfile.txt"
```

**Response**: Same as JSON upload

### Galaksio API

#### Store Endpoint
```bash
POST http://localhost:8080/store
Content-Type: application/json

{
  "data": "base64_encoded_or_raw_json",
  "filename": "data.json",
  "options": {
    "permanent": false,
    "ttl": 3600
  }
}
```

**Response (402 Payment Required)**:
```json
{
  "jobId": "job-123",
  "provider": "openx402",
  "price_usd": 0.01,
  "file_size_bytes": 1234,
  "payment": {
    "accepts": [{
      "scheme": "x402",
      "network": "ethereum",
      "payTo": "0x...",
      "asset": "USDC",
      "maxAmountRequired": "0.01"
    }]
  }
}
```

**Response (After Payment)**:
```json
{
  "jobId": "job-123",
  "status": "completed",
  "result": {
    "success": true,
    "ipfsHash": "QmXxx...",
    "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmXxx...",
    "endpoint": "/pin/json",
    "priceUsd": 0.01
  }
}
```

## Example Scenarios

### Scenario 1: JSON File Upload with Filename

```bash
# Client Request
POST /store
{
  "data": "{\"name\": \"Alice\", \"age\": 30}",
  "filename": "user.json",
  "options": { "ttl": 3600 }
}
```

**Flow**:
1. Broker extracts `filename: "user.json"`
2. Quote Engine detects `.json` extension → uses `/pin/json` → returns 0.01 USDC quote
3. Client pays 0.01 USDC
4. Executor detects `.json` in `meta.fileName` → calls `pinJson()`
5. OpenX402 stores JSON at `/pin/json`
6. Client receives IPFS hash

### Scenario 2: JSON File Upload without Filename

```bash
# Client Request
POST /store
{
  "data": "{\"name\": \"Bob\", \"age\": 25}",
  "options": { "ttl": 3600 }
}
```

**Flow**:
1. Broker has no filename
2. Quote Engine tries to parse `fileContent` → detects valid JSON → uses `/pin/json`
3. Executor tries to parse `fileInline` → detects valid JSON → calls `pinJson()`
4. Result: Same 0.01 USDC pricing and `/pin/json` endpoint

### Scenario 3: Base64 JSON File Upload

```bash
# Client Request
POST /store
{
  "data": "eyJuYW1lIjogIkNoYXJsaWUiLCAiYWdlIjogMzV9",  # base64 of JSON
  "filename": "data.json",
  "options": { "ttl": 3600 }
}
```

**Flow**:
1. Quote Engine detects `.json` extension
2. Executor decodes base64 → detects valid JSON → calls `pinJson()`
3. OpenX402 receives decoded JSON at `/pin/json`

### Scenario 4: Regular File Upload

```bash
# Client Request
POST /store
{
  "data": "SGVsbG8gV29ybGQ=",  # base64 of "Hello World"
  "filename": "hello.txt",
  "options": { "ttl": 3600 }
}
```

**Flow**:
1. Quote Engine detects `.txt` extension → uses `/pin/file`
2. Executor creates FormData with file → calls `pinFile()`
3. OpenX402 receives file at `/pin/file` with variable pricing

## Configuration

### Environment Variables

#### Broker
```bash
QUOTE_ENGINE_URL=http://localhost:8081
EXECUTOR_URL=http://localhost:8082
```

#### Quote Engine
```bash
OPENX402_BASE_URL=https://ipfs.openx402.ai
```

#### Executor
```bash
OPENX402_BASE_URL=https://ipfs.openx402.ai
```

## Error Handling

### Invalid JSON Detection

If a file is named `.json` but contains invalid JSON:

**Quote Engine**: Still quotes for `/pin/json` (based on extension)

**Executor**: Tries to parse → throws error:
```json
{
  "jobId": "job-123",
  "status": "failed",
  "error": "Invalid JSON content in fileInline"
}
```

**Solution**: Ensure JSON content is valid before upload

### Missing File Data

If neither `fileInline` nor `fileUrl` is provided:

```json
{
  "jobId": "job-123",
  "status": "failed",
  "error": "Either fileInline or fileUrl is required"
}
```

## Benefits of Automatic JSON Detection

1. **Cost Optimization**: JSON files get fixed 0.01 USDC pricing
2. **Simplified Client Integration**: Clients don't need to specify endpoint
3. **Consistent Detection**: Both quote and execution use same logic
4. **Multiple Detection Methods**: Filename, URL, and content validation
5. **Base64 Support**: Handles encoded content seamlessly

## Testing

### Test JSON Detection

```bash
# Test 1: JSON file with extension
curl -X POST http://localhost:8080/store \
  -H "Content-Type: application/json" \
  -d '{
    "data": "{\"test\": true}",
    "filename": "test.json"
  }'

# Test 2: JSON without extension
curl -X POST http://localhost:8080/store \
  -H "Content-Type: application/json" \
  -d '{
    "data": "{\"test\": true}"
  }'

# Test 3: Regular file
curl -X POST http://localhost:8080/store \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Hello World",
    "filename": "hello.txt"
  }'
```

## Summary

The Galaksio system provides intelligent, automatic JSON file detection across all three server components:

1. **Broker**: Passes filename and content to Quote Engine
2. **Quote Engine**: Detects JSON and returns appropriate pricing
3. **Executor**: Validates JSON and routes to correct OpenX402 endpoint

This ensures optimal pricing (0.01 USDC for JSON) and seamless integration without requiring clients to manually specify endpoints.

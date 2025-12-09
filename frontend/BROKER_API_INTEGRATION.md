# BROKER API INTEGRATION GUIDE (Parte 3)

This document describes the **REDUCED BROKER API** integration in the Galaksio frontend, following the authoritative specification from "GALAKSIO BROKER API — REDUCED OPENAPI FOR FRONTEND (PARTE 3)".

## 🎯 Key Principles

1. **Frontend NEVER calls broker endpoints directly** - Always use `src/lib/broker.ts` helpers
2. **UI NEVER implements X402 payment logic** - The broker helper handles all payment flows automatically
3. **UI NEVER queries job status from broker** - Only `/api/jobs/[brokerJobId]/refresh` may call broker status endpoints
4. **UI NEVER displays 402 responses** - Payment flow is invisible to the user (just wallet signature prompt)
5. **UI ONLY uses safe fields** - As specified in the reduced spec

## 📁 File Structure

```
src/
├── lib/
│   ├── broker.ts           # Broker helper with X402 payment handling
│   └── x402-client.ts      # X402 payment implementation (wallet signing)
├── types/
│   └── broker.ts           # Broker API type definitions (reduced spec)
└── app/api/jobs/
    ├── route.ts            # GET /api/jobs - List user's jobs
    ├── run/route.ts        # POST /api/jobs/run - Save compute job to DB
    ├── store/route.ts      # POST /api/jobs/store - Save storage job to DB
    └── [brokerJobId]/
        └── refresh/
            └── route.ts    # PATCH /api/jobs/:id/refresh - Refresh from broker
```

## 🔌 Broker Endpoints (Reduced Spec)

### Base URL
Configure via environment variable:
```bash
NEXT_PUBLIC_BROKER_API_URL=https://multidimensional-reviewless-freda.ngrok-free.dev
```

### POST /store
Store data in decentralized storage (IPFS, Arweave, etc.)

**Request:**
```typescript
{
  data: string | File,          // Base64 or raw string or File object
  filename?: string,
  options?: {
    permanent?: boolean,
    ttl?: number,
    provider?: string
  }
}
```

**Response (after X402 payment):**
```typescript
{
  jobId: string,
  status: string,
  result: {
    cid: string,      // IPFS CID or Arweave TX ID
    url: string,      // Gateway URL
    provider: string, // e.g., "spuro", "ipfs"
    size: number      // Bytes
  }
}
```

**Safe fields for UI:**
- `jobId`, `status`
- `result.cid`, `result.url`, `result.provider`, `result.size`

---

### POST /run
Execute code using CPU sandbox or GPU compute

**Request:**
```typescript
{
  code: string,
  language: string,         // "python", "javascript"
  gpu_type?: string,        // "l40s", "a100"
  gpu_count?: number,       // 1-8
  timeout?: number,         // seconds
  on_demand?: boolean
}
```

**Response (after X402 payment):**
```typescript
{
  job_id: string,
  status: string,
  output: string,           // stdout
  error: string,            // stderr
  execution_time: number    // milliseconds
}
```

**Safe fields for UI:**
- `job_id`, `status`
- `output` (stdout), `error` (stderr), `execution_time`

---

### POST /cache
Create distributed cache instance

**Request:**
```typescript
{
  data: string | File,
  ttl?: number,           // seconds
  contentType?: string
}
```

**Response (after X402 payment):**
```typescript
{
  jobId: string,
  status: string,
  result: {
    cacheId: string,
    endpoint: string,
    region: string,
    provider: string
  }
}
```

**Safe fields for UI:**
- `jobId`
- `result.cacheId`, `result.endpoint`, `result.region`, `result.provider`

---

### GET /job/{id} ⚠️ BACKEND ONLY
Retrieve full job metadata from broker

**⚠️ IMPORTANT:** Frontend UI must NEVER call this endpoint directly.
Only `/api/jobs/[brokerJobId]/refresh` may call this.

**Response:**
```typescript
{
  id: string,
  status: "queued" | "awaiting_payment" | "running" | "completed" | "failed",
  provider?: string,
  result?: object,
  quote?: object,
  requester?: string,
  createdAt?: string,
  updatedAt?: string
}
```

---

## 🔐 X402 Payment Flow

The broker helper (`src/lib/broker.ts`) automatically handles all payment flows:

1. **User calls** `broker.run()` or `broker.store()`
2. **Helper makes request** to broker endpoint
3. **Broker returns 402** Payment Required (if not paid)
4. **Helper automatically:**
   - Shows wallet signature popup
   - Sends on-chain payment (e.g., USDC on Avalanche C-Chain)
   - Retries request with payment proof header
5. **Helper returns 200** response to caller

**User only sees:**
- Wallet signature popup (for payment authorization)
- Final successful response

**User NEVER sees:**
- 402 responses
- Payment metadata
- X402 protocol details

---

## 💻 Usage Examples

### Storage (Upload File)

```typescript
import { broker } from '@/lib/broker';

// Client-side component
async function uploadFile(file: File) {
  try {
    const result = await broker.store({
      data: file,
      filename: file.name,
      options: {
        permanent: true,
        provider: 'ipfs'
      }
    });
    
    // Save to DB via internal API
    await fetch('/api/jobs/store', {
      method: 'POST',
      body: JSON.stringify(result)
    });
    
    console.log('File uploaded:', result.result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Compute (Run Python Code)

```typescript
import { broker } from '@/lib/broker';

// Client-side component
async function runPythonCode(code: string) {
  try {
    const result = await broker.run({
      code,
      language: 'python',
      gpu_type: 'l40s',
      gpu_count: 1,
      timeout: 300
    });
    
    // Save to DB via internal API
    await fetch('/api/jobs/run', {
      method: 'POST',
      body: JSON.stringify(result)
    });
    
    console.log('Output:', result.output);
    console.log('Execution time:', result.execution_time, 'ms');
  } catch (error) {
    console.error('Execution failed:', error);
  }
}
```

### Cache (Temporary Storage)

```typescript
import { broker } from '@/lib/broker';

// Client-side component
async function cacheData(data: string) {
  try {
    const result = await broker.cache({
      data,
      ttl: 3600, // 1 hour
      contentType: 'application/json'
    });
    
    console.log('Cache endpoint:', result.result.endpoint);
    console.log('Cache ID:', result.result.cacheId);
  } catch (error) {
    console.error('Cache failed:', error);
  }
}
```

### List User's Jobs

```typescript
// Client-side component
async function listMyJobs(kind?: 'run' | 'store' | 'cache') {
  const url = kind 
    ? `/api/jobs?kind=${kind}`
    : '/api/jobs';
    
  const response = await fetch(url);
  const jobs = await response.json();
  
  return jobs;
}
```

### Refresh Job Status

```typescript
// Client-side component
async function refreshJobStatus(brokerJobId: string) {
  const response = await fetch(`/api/jobs/${brokerJobId}/refresh`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brokerUrl: process.env.NEXT_PUBLIC_BROKER_API_URL
    })
  });
  
  const updatedJob = await response.json();
  return updatedJob;
}
```

---

## 🚫 Forbidden Actions

**Frontend code must NEVER:**

1. ❌ Query broker directly for listing jobs
2. ❌ Call `/job/{id}` or `/status/{id}` endpoints
3. ❌ Parse or display 402 responses
4. ❌ Display raw X402 metadata (`accepts`, `payTo`, `asset`, etc.)
5. ❌ Implement wallet payment logic
6. ❌ Store broker responses in `localStorage`
7. ❌ Modify broker responses before sending to internal API
8. ❌ Use fields not listed in "safe fields" section

---

## 📊 Database Schema

Jobs are stored in the `UserJob` table:

```prisma
model UserJob {
  id             String   @id @default(uuid())
  userAccountId  String
  kind           String   // 'run' | 'store' | 'cache'
  brokerJobId    String
  status         String
  
  // Storage fields
  txId           String?  // result.cid
  url            String?  // result.url
  provider       String?
  size           Int?
  
  // Compute fields
  stdout         String?  // output
  stderr         String?  // error
  executionTimeMs Int?    // execution_time
  
  // Metadata
  rawResult      Json?    // Full broker response
  rawStatus      Json?    // Full status response
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│   UI Component  │
│  (Client-side)  │
└────────┬────────┘
         │ 1. Call broker.store() / broker.run()
         ▼
┌─────────────────────┐
│  src/lib/broker.ts  │ ◄──── Handles X402 payment automatically
│  (Client-side)      │
└────────┬────────────┘
         │ 2. POST /store or /run
         ▼
┌────────────────────────┐
│  Galaksio Broker API   │
│  (External Service)    │
└────────┬───────────────┘
         │ 3. Returns 200 response (after payment)
         ▼
┌─────────────────┐
│  UI Component   │
└────────┬────────┘
         │ 4. POST /api/jobs/store or /api/jobs/run
         ▼
┌──────────────────────┐
│  Internal API Route  │ ──► Saves to PostgreSQL
│  (Server-side)       │
└──────────────────────┘
```

---

## ⚙️ Environment Configuration

### .env.local (create this file)
```bash
# Broker API URL (REQUIRED)
NEXT_PUBLIC_BROKER_API_URL=https://multidimensional-reviewless-freda.ngrok-free.dev

# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@localhost:5432/galaksio_db
DIRECT_URL=postgresql://user:password@localhost:5432/galaksio_db

# NextAuth (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# GitHub OAuth (if using)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## 🧪 Testing

### Test X402 Payment Flow
1. Connect MetaMask/wallet to Base or Avalanche C-Chain
2. Ensure wallet has USDC balance
3. Call `broker.store()` or `broker.run()`
4. Verify wallet signature popup appears
5. Sign transaction
6. Verify final response is returned

### Test Job Persistence
1. Call broker helper
2. Verify response contains expected safe fields
3. Save to DB via `/api/jobs/store` or `/api/jobs/run`
4. Query `/api/jobs` to verify job is listed
5. Call `/api/jobs/:id/refresh` to update status

---

## 🐛 Troubleshooting

### "Payment required but wallet not connected"
- Ensure MetaMask or compatible wallet is installed
- Ensure wallet is connected to the correct network (Base/Avalanche)
- Ensure `window.ethereum` is available

### "Broker request failed: 402"
- The X402 payment flow failed
- Check wallet has sufficient USDC balance
- Check wallet is on the correct network
- Check payment asset address in broker response

### "Failed to fetch job status from broker"
- Verify `NEXT_PUBLIC_BROKER_API_URL` is set correctly
- Check broker service is running
- Check network connectivity

### "Job not found in database"
- Verify job was saved via `/api/jobs/store` or `/api/jobs/run`
- Check `brokerJobId` matches between broker response and DB
- Verify user authentication

---

## 📚 Type Definitions

All types are defined in `src/types/broker.ts`:

- `BrokerStoreResponse` - Storage job response
- `BrokerRunResponse` - Compute job response
- `BrokerCacheResponse` - Cache job response
- `BrokerJobStatusResponse` - Job status response (backend only)
- `BrokerStoreRequest` - Storage request body
- `BrokerRunRequest` - Compute request body
- `BrokerCacheRequest` - Cache request body
- `JobKind` - Job type enum
- `JobStatus` - Job status enum

---

## 🔒 Security Notes

1. **Never expose broker responses to unauthorized users**
2. **Always verify user ownership before refreshing job status**
3. **Never log sensitive payment data**
4. **Validate all broker responses before saving to DB**
5. **Use HTTPS for all broker communication**
6. **Store broker URL in environment variables, never hardcode**

---

## 📝 Summary

This integration follows the **REDUCED BROKER API SPEC (Parte 3)** which simplifies broker interactions by:

✅ Hiding X402 payment complexity from UI  
✅ Exposing only safe, UI-relevant fields  
✅ Preventing direct broker queries from frontend  
✅ Centralizing job status refresh in backend routes  
✅ Providing clean, typed interfaces for all operations  

The frontend developer only needs to:
1. Import `broker` from `@/lib/broker`
2. Call `broker.run()` / `broker.store()` / `broker.cache()`
3. Save response to DB via internal API routes
4. Display safe fields in UI

Everything else (payment, retries, status polling) is handled automatically.

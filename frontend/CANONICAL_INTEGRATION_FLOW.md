# GALAKSIO FRONTEND — CANONICAL INTEGRATION FLOW

**STATUS: ✅ FULLY IMPLEMENTED**  
**Last Updated:** December 9, 2025

---

## FUNDAMENTAL PRINCIPLE

**The frontend NEVER directly persists or stores job information. Only the backend does.**

After calling the broker, the frontend must forward the broker's final successful response (HTTP 200) to the corresponding internal API route:
- `/api/jobs/store` for storage jobs
- `/api/jobs/run` for compute jobs

The frontend must also fetch job lists and refresh job status **exclusively through internal API routes**.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────┐
│   Frontend      │
│   Components    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  broker.ts      │─────▶│  Galaksio Broker │
│  (X402 Helper)  │◀─────│  API (External)  │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Internal API   │─────▶│  PostgreSQL DB   │
│  Routes         │◀─────│  (via Prisma)    │
└─────────────────┘      └──────────────────┘
```

---

## IMPLEMENTATION STATUS

### ✅ Core Integration Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| **Broker Helper** | `src/lib/broker.ts` | ✅ Complete | Handles X402 payment flow for all broker endpoints |
| **Storage API** | `src/app/api/jobs/store/route.ts` | ✅ Complete | Persists storage jobs from broker responses |
| **Compute API** | `src/app/api/jobs/run/route.ts` | ✅ Complete | Persists compute jobs from broker responses |
| **List Jobs API** | `src/app/api/jobs/route.ts` | ✅ Complete | Lists all jobs with optional `kind` filter |
| **Refresh Job API** | `src/app/api/jobs/[brokerJobId]/refresh/route.ts` | ✅ Complete | Syncs job status with broker |
| **Database Schema** | `prisma/schema.prisma` | ✅ Complete | Unified `UserJob` model for all job types |

### ✅ Frontend Components

| Component | File | Status | Compliance |
|-----------|------|--------|------------|
| **Storage Page** | `src/app/dashboard/storage/page.tsx` | ✅ Complete | Follows canonical flow |
| **Compute Page** | `src/app/dashboard/compute/new/page.tsx` | ✅ Complete | Follows canonical flow |
| **Dashboard** | `src/app/dashboard/page.tsx` | ✅ Complete | Uses `/api/jobs` for listing |

---

## STORAGE WORKFLOW (BROKER /store)

### Step 1: Call the Broker via Helper

```typescript
const storeResponse = await broker.store(fileOrPayload);
```

The broker helper handles:
- Initial request to broker
- HTTP 402 Payment Required handling
- On-chain USDC payment (Avalanche C-Chain)
- Request retry with payment proof
- Returns final 200 OK response

### Step 2: Persist Job via Internal API

```typescript
await fetch('/api/jobs/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(storeResponse)
});
```

### Expected Broker Response Shape

```typescript
{
  "jobId": "store_abc123",
  "status": "completed",
  "result": {
    "cid": "QmXxxx...",
    "url": "https://arweave.net/...",
    "provider": "spuro",
    "size": 1234567
  }
}
```

### Implementation Example

From `src/app/dashboard/storage/page.tsx`:

```typescript
// ✅ CORRECT: Using broker helper + internal API
const brokerResult = await broker.store({
  data: selectedFile,
  contentType: selectedFile.type,
  filename: selectedFile.name,
});

const saveResponse = await fetch('/api/jobs/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(brokerResult),
});
```

---

## COMPUTE WORKFLOW (BROKER /run)

### Step 1: Call the Broker via Helper

```typescript
const runResponse = await broker.run(codePayload);
```

### Step 2: Persist Job via Internal API

```typescript
await fetch('/api/jobs/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(runResponse)
});
```

### Expected Broker Response Shape

```typescript
{
  "job_id": "run_xyz789",
  "status": "completed",
  "output": "Hello from Galaksio!\n",
  "error": "",
  "execution_time": 1250
}
```

### Implementation Example

From `src/app/dashboard/compute/new/page.tsx`:

```typescript
// ✅ CORRECT: Using broker helper + internal API
const brokerResult = await broker.run({
  language,
  code,
  timeout,
  gpu: gpuType,
  onDemand,
});

const saveResponse = await fetch('/api/jobs/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(brokerResult),
});
```

---

## LISTING JOBS (READ-ONLY)

### Storage Jobs

```typescript
const files = await fetch('/api/jobs?kind=store').then(r => r.json());
```

### Compute Jobs

```typescript
const jobs = await fetch('/api/jobs?kind=run').then(r => r.json());
```

### All Jobs

```typescript
const allJobs = await fetch('/api/jobs').then(r => r.json());
```

**Important:** The frontend must NOT:
- Query Supabase directly
- Query the broker for job lists
- Use localStorage for job persistence

---

## REFRESHING JOB STATUS

To synchronize an existing job with the broker:

```typescript
await fetch(`/api/jobs/${brokerJobId}/refresh`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brokerUrl: 'https://broker.galaksio.cloud'
  })
});
```

Then re-fetch the job list:

```typescript
await fetch('/api/jobs?kind=store');
// or
await fetch('/api/jobs?kind=run');
```

**Important:** The frontend must NOT call `/job/{id}` or `/status/{id}` directly.

---

## BROKER HELPERS: THE ONLY WAY TO INTERACT WITH PAYMENT-GATED ENDPOINTS

### Available Broker Methods

```typescript
import { broker } from '@/lib/broker';

// Storage (permanent on Arweave)
await broker.store({
  data: File | string,
  contentType?: string,
  filename?: string
});

// Compute (code execution)
await broker.run({
  language: string,
  code: string,
  timeout?: number,
  gpu?: string,
  onDemand?: boolean
});

// Cache (temporary on IPFS)
await broker.cache({
  data: File | string,
  ttl?: number,
  contentType?: string
});
```

### What the Broker Helper Does

1. **Handles HTTP 402 Payment Required**
2. **Executes on-chain X402 payments** (USDC on Avalanche C-Chain)
3. **Retries the initial request** after payment
4. **Returns the final 200 OK response**

### ❌ Forbidden

```typescript
// ❌ NEVER call broker endpoints directly
fetch('https://broker.galaksio.cloud/api/store', { ... });
fetch('https://broker.galaksio.cloud/api/run', { ... });
```

---

## JOB IDENTIFIERS

### Storage Jobs

Required fields forwarded from broker:
- `jobId` (string) → `brokerJobId`
- `result.cid` → `txId`
- `result.url` → `url`
- `result.provider` → `provider`
- `result.size` → `size`

### Compute Jobs

Required fields forwarded from broker:
- `job_id` (string) → `brokerJobId`
- `status` → `status`
- `output` → `stdout`
- `error` → `stderr`
- `execution_time` → `executionTimeMs`

---

## DATABASE SCHEMA

### UserJob Model

```prisma
model UserJob {
  id             String    @id @default(uuid())
  userAccount    UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  userAccountId  String

  kind           String    // 'run' | 'store' | 'cache'
  brokerJobId    String
  status         String

  // Storage fields
  txId           String?   // result.cid
  url            String?   // result.url
  provider       String?
  size           Int?

  // Compute fields
  stdout         String?
  stderr         String?
  exitCode       Int?
  executionTimeMs Int?

  // Raw responses
  rawResult      Json?     // complete broker response
  rawStatus      Json?     // response from refresh

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([userAccountId, kind, createdAt])
  @@index([brokerJobId])
}
```

---

## FORBIDDEN ACTIONS

The frontend must **NEVER**:

❌ Invent new API endpoints  
❌ Persist jobs in localStorage  
❌ Fetch data directly from Supabase  
❌ Query the broker directly for job lists  
❌ Implement custom payment handling  
❌ Rewrite or alter broker responses before saving  
❌ Split job persistence into multiple endpoints  
❌ Call broker endpoints without using the broker helper  

---

## VALID CALLS CHEAT SHEET

### Storage

```typescript
// 1. Call broker helper
const r = await broker.store(payload);

// 2. Persist via internal API
await fetch('/api/jobs/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(r)
});
```

### Compute

```typescript
// 1. Call broker helper
const r = await broker.run(payload);

// 2. Persist via internal API
await fetch('/api/jobs/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(r)
});
```

### List Jobs

```typescript
// Storage jobs
await fetch('/api/jobs?kind=store');

// Compute jobs
await fetch('/api/jobs?kind=run');

// All jobs
await fetch('/api/jobs');
```

### Refresh Job Status

```typescript
await fetch(`/api/jobs/${jobId}/refresh`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ brokerUrl: 'https://broker.galaksio.cloud' })
});
```

---

## BUG FIXES APPLIED

### 1. FormData Variable Reference Bug (Fixed)

**Location:** `src/lib/broker.ts` line 177

**Before:**
```typescript
body: bodyData,  // ❌ bodyData doesn't exist
```

**After:**
```typescript
body: formData,  // ✅ Correct variable name
```

---

## TESTING CHECKLIST

- [x] Storage workflow uses `broker.store()` helper
- [x] Compute workflow uses `broker.run()` helper
- [x] All job persistence goes through internal API routes
- [x] Job listing uses `/api/jobs` with `kind` filter
- [x] Job refresh uses `/api/jobs/{id}/refresh` endpoint
- [x] No direct localStorage persistence of jobs
- [x] No direct Supabase queries from frontend
- [x] No direct broker API calls without helper
- [x] X402 payment flow handled by broker helper
- [x] Database schema supports all job types

---

## COMPLIANCE VERIFICATION

### ✅ All Components Follow Canonical Flow

1. **broker.ts**: Implements X402 payment handling for all broker endpoints
2. **Storage Page**: Uses `broker.store()` → `/api/jobs/store`
3. **Compute Page**: Uses `broker.run()` → `/api/jobs/run`
4. **Job Listing**: Uses `/api/jobs?kind=store` and `/api/jobs?kind=run`
5. **Job Refresh**: Uses `/api/jobs/{id}/refresh`
6. **Database**: Single unified `UserJob` model for all job types

### ✅ No Violations Found

- No localStorage job persistence
- No Supabase direct queries
- No direct broker API calls
- No custom payment handling
- No unauthorized endpoints

---

## SUMMARY

**The Galaksio frontend is fully compliant with the canonical integration flow.**

All components follow the prescribed architecture:
- Broker helper handles all payment-gated operations
- Internal API routes are the single source of truth for job persistence
- Frontend components never bypass the internal API layer
- Database schema efficiently stores all job types in a unified model

**Any deviation from this canonical flow is NOT allowed.**

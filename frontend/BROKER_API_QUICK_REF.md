# BROKER API QUICK REFERENCE

Quick reference for the Galaksio Broker API integration (Reduced Spec - Parte 3)

## 🔗 Base URL
```bash
NEXT_PUBLIC_BROKER_API_URL=https://multidimensional-reviewless-freda.ngrok-free.dev
```

## 📦 Import
```typescript
import { broker } from '@/lib/broker';
import type { BrokerStoreResponse, BrokerRunResponse } from '@/types/broker';
```

## 🚀 Quick Usage

### Store File
```typescript
const result = await broker.store({
  data: file,
  filename: 'myfile.txt',
  options: { permanent: true }
});
// Returns: { jobId, status, result: { cid, url, provider, size } }
```

### Run Code
```typescript
const result = await broker.run({
  code: 'print("Hello")',
  language: 'python',
  gpu_type: 'l40s',
  timeout: 300
});
// Returns: { job_id, status, output, error, execution_time }
```

### Create Cache
```typescript
const result = await broker.cache({
  data: 'temporary data',
  ttl: 3600
});
// Returns: { jobId, status, result: { cacheId, endpoint, region, provider } }
```

## 💾 Save to Database

```typescript
// After broker call, save to DB:
await fetch('/api/jobs/store', {
  method: 'POST',
  body: JSON.stringify(result)
});
```

## 📋 List Jobs

```typescript
// All jobs
const jobs = await fetch('/api/jobs').then(r => r.json());

// Filter by kind
const storageJobs = await fetch('/api/jobs?kind=store').then(r => r.json());
const computeJobs = await fetch('/api/jobs?kind=run').then(r => r.json());
```

## 🔄 Refresh Job Status

```typescript
await fetch(`/api/jobs/${brokerJobId}/refresh`, {
  method: 'PATCH',
  body: JSON.stringify({
    brokerUrl: process.env.NEXT_PUBLIC_BROKER_API_URL
  })
});
```

## ✅ Safe Fields for UI

### Storage Jobs
- `jobId`, `status`
- `result.cid`, `result.url`, `result.provider`, `result.size`

### Compute Jobs
- `job_id`, `status`
- `output`, `error`, `execution_time`

### Cache Jobs
- `jobId`, `status`
- `result.cacheId`, `result.endpoint`, `result.region`, `result.provider`

## 🚫 Never Do This

❌ Call broker endpoints directly from UI  
❌ Parse 402 responses  
❌ Implement X402 payment logic  
❌ Query `/job/{id}` or `/status/{id}` from frontend  
❌ Use fields not listed in "safe fields"  
❌ Hardcode broker URL  

## ✅ Always Do This

✅ Use `broker` helpers from `@/lib/broker`  
✅ Save responses via internal API routes  
✅ Use types from `@/types/broker`  
✅ Handle errors gracefully  
✅ Verify wallet connection before calling payment-gated endpoints  

## 🎯 Full Integration Flow

```typescript
// 1. Client calls broker helper (X402 payment handled automatically)
const result = await broker.store({ data: file });

// 2. Save to database via internal API
await fetch('/api/jobs/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(result)
});

// 3. Display in UI using safe fields
<div>
  <p>CID: {result.result.cid}</p>
  <a href={result.result.url}>View File</a>
  <p>Size: {result.result.size} bytes</p>
</div>
```

## 🔐 Payment Flow (Automatic)

User experience:
1. Call `broker.store()` or `broker.run()`
2. See wallet signature popup (if payment required)
3. Sign transaction
4. Receive final response

Everything else is automatic! 🎉

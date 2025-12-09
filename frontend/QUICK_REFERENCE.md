# GALAKSIO CANONICAL FLOW — QUICK REFERENCE

## 🚀 Storage Upload

```typescript
// 1. Call broker helper (handles X402 payment)
const result = await broker.store({
  data: fileOrText,
  contentType: 'image/png', // optional
  filename: 'photo.png'      // optional
});

// 2. Save to database via internal API
await fetch('/api/jobs/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(result)
});
```

## 💻 Compute Execution

```typescript
// 1. Call broker helper (handles X402 payment)
const result = await broker.run({
  language: 'python',
  code: 'print("Hello")',
  timeout: 60,         // optional
  gpu: 'l40s',         // optional
  onDemand: false      // optional
});

// 2. Save to database via internal API
await fetch('/api/jobs/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(result)
});
```

## 📂 List Jobs

```typescript
// All storage jobs
const files = await fetch('/api/jobs?kind=store').then(r => r.json());

// All compute jobs
const jobs = await fetch('/api/jobs?kind=run').then(r => r.json());

// All jobs (any type)
const allJobs = await fetch('/api/jobs').then(r => r.json());
```

## 🔄 Refresh Job Status

```typescript
await fetch(`/api/jobs/${brokerJobId}/refresh`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brokerUrl: 'https://broker.galaksio.cloud'
  })
});

// Then reload jobs
const updated = await fetch('/api/jobs?kind=store').then(r => r.json());
```

## ❌ DON'T DO THIS

```typescript
// ❌ Never call broker endpoints directly
fetch('https://broker.galaksio.cloud/api/store', { ... });

// ❌ Never save jobs to localStorage
localStorage.setItem('jobs', JSON.stringify(jobs));

// ❌ Never query broker for job lists
fetch('https://broker.galaksio.cloud/jobs');

// ❌ Never query broker for job status directly
fetch(`https://broker.galaksio.cloud/job/${id}`);

// ❌ Never query Supabase directly
supabase.from('jobs').select('*');
```

## ✅ ALWAYS DO THIS

```typescript
// ✅ Use broker helper
const result = await broker.store(...);

// ✅ Save via internal API
await fetch('/api/jobs/store', { ... });

// ✅ List via internal API
await fetch('/api/jobs?kind=store');

// ✅ Refresh via internal API
await fetch(`/api/jobs/${id}/refresh`, { ... });
```

## 📦 Available Broker Methods

```typescript
import { broker } from '@/lib/broker';

// Permanent storage on Arweave
broker.store({ data, contentType?, filename? })

// Code execution with GPU
broker.run({ language, code, timeout?, gpu?, onDemand? })

// Temporary cache on IPFS
broker.cache({ data, ttl?, contentType? })
```

## 🔑 Key Principles

1. **Frontend never persists jobs** — only the backend does
2. **Always use broker helpers** — they handle X402 payments
3. **Always save via internal API** — never skip this step
4. **Always list via internal API** — never query broker or Supabase
5. **Always refresh via internal API** — never call broker status endpoints

---

**For detailed documentation, see:** `CANONICAL_INTEGRATION_FLOW.md`

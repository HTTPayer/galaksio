# Galaksio Refactoring Plan: Simplified x402 Broker

## Overview

This document outlines the refactoring plan to simplify Galaksio's architecture into a focused x402 payment broker for three specific providers:

- **xCache** - Cache/Storage provider (https://api.xcache.io)
- **OpenX402 IPFS** - IPFS storage provider (https://ipfs.openx402.ai)
- **Merit Systems** - Compute provider (https://echo.router.merit.systems/resource/e2b/execute)

## Design Philosophy

**Client Simplicity**: "Here is the file/data I want to store/run, tell me how much and charge me"

The client only needs to provide:
1. The file or data (inline, base64, or URL)
2. The operation type (run vs store)

The broker handles:
- File size calculation
- Provider selection (best price)
- Quote fetching via x402
- Payment instruction generation
- Job execution (when payment received)

---

## Architecture Changes

### 1. Broker API Simplification

#### Current State
- Single `/run` endpoint handling all task types (compute, storage, cache)
- Complex payload mapping with provider-specific parameters
- Manual specification of provider, resources, etc.

#### New State
Two dedicated endpoints:

```
POST /store   - Store files/data (xCache or IPFS)
POST /run     - Execute code (Merit Systems)
```

#### New Request Format

**Store Endpoint** (`POST /store`)
```json
{
  "data": "base64-encoded-file" | { "url": "https://..." },
  "filename": "optional.txt",
  "options": {
    "permanent": false,      // true = prefer IPFS, false = prefer cache
    "ttl": 3600              // optional, for cache
  }
}
```

**Run Endpoint** (`POST /run`)
```json
{
  "code": "console.log('hello')" | { "url": "https://..." },
  "language": "python" | "javascript"  // optional
}
```

---

### 2. Broker Workflow (Simplified)

#### Store Workflow
```
1. Client → POST /store with file/data
2. Broker calculates file size
3. Broker queries Quote Engine for best price (xCache vs IPFS)
4. Quote Engine tries x402 endpoints for each provider
5. Broker returns cheapest option with x402 payment instructions (402 response)
6. Client pays using x402 payment header
7. Broker verifies payment via x402-express middleware
8. Broker forwards job to Executor with selected provider
9. Executor stores file and returns result
```

#### Run Workflow
```
1. Client → POST /run with code snippet
2. Broker calculates code size
3. Broker queries Quote Engine for Merit Systems price
4. Quote Engine tries Merit Systems x402 endpoint
5. Broker returns price with x402 payment instructions (402 response)
6. Client pays using x402 payment header
7. Broker verifies payment via x402-express middleware
8. Broker forwards job to Executor
9. Executor runs code on Merit Systems and returns result
```

---

## Component-by-Component Refactoring

### Broker (`backend/broker`)

#### Files to Modify

**`src/routes/job.ts`** → **`src/routes/store.ts`** + **`src/routes/run.ts`**

**New: `src/routes/store.ts`**
```typescript
import express from "express";
import { getStoreQuotes } from "../services/quoteClient.js";
import { runOnExecutor } from "../services/executorClient.js";
import { createJob, updateJob } from "../db/jobStore.js";

const router = express.Router();

// Storage endpoint - returns 402 if unpaid, stores if paid
router.post("/store", async (req, res) => {
  const { data, filename, options } = req.body;

  // Validate input
  if (!data) {
    return res.status(400).json({ error: "data is required" });
  }

  // Calculate file size
  const fileSize = calculateSize(data);

  // Create job
  const job = createJob({
    requester: req.headers["x-wallet"] || "anonymous",
    status: "awaiting_payment",
    type: "store"
  });

  try {
    // Get quotes from xcache and IPFS
    const quotes = await getStoreQuotes({
      fileSize,
      permanent: options?.permanent || false,
      ttl: options?.ttl
    });

    // Select cheapest provider
    const bestQuote = quotes.sort((a, b) => a.price_usd - b.price_usd)[0];

    updateJob(job.id, {
      status: "payment_required",
      quote: bestQuote,
      provider: bestQuote.provider
    });

    // Check if payment was provided (x402 middleware sets req.x402)
    if (!(req as any).x402?.verified) {
      // Return 402 with payment instructions
      return res.status(402).json({
        jobId: job.id,
        provider: bestQuote.provider,
        price_usd: bestQuote.price_usd,
        payment: bestQuote.x402_instructions
      });
    }

    // Payment verified, execute the job
    updateJob(job.id, { status: "running" });

    const execResp = await runOnExecutor({
      jobId: job.id,
      data,
      filename,
      options,
      quote: bestQuote
    });

    updateJob(job.id, { status: "completed", result: execResp });
    return res.json({ jobId: job.id, status: "completed", result: execResp });

  } catch (err: any) {
    updateJob(job.id, { status: "failed", result: { error: err.message } });
    return res.status(500).json({ error: err.message });
  }
});

function calculateSize(data: any): number {
  if (typeof data === 'string') {
    // Base64 encoded
    return Buffer.from(data, 'base64').length;
  } else if (data.url) {
    // Will need to fetch to get size, or estimate
    return 0; // TODO: implement URL size detection
  } else if (typeof data === 'object') {
    // JSON data
    return Buffer.from(JSON.stringify(data)).length;
  }
  return 0;
}

export default router;
```

**New: `src/routes/run.ts`**
```typescript
import express from "express";
import { getRunQuote } from "../services/quoteClient.js";
import { runOnExecutor } from "../services/executorClient.js";
import { createJob, updateJob } from "../db/jobStore.js";

const router = express.Router();

// Compute endpoint - returns 402 if unpaid, executes if paid
router.post("/run", async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: "code is required" });
  }

  const codeSize = Buffer.from(
    typeof code === 'string' ? code : JSON.stringify(code)
  ).length;

  const job = createJob({
    requester: req.headers["x-wallet"] || "anonymous",
    status: "awaiting_payment",
    type: "compute"
  });

  try {
    // Get quote from Merit Systems
    const quote = await getRunQuote({ codeSize, language });

    updateJob(job.id, {
      status: "payment_required",
      quote,
      provider: "merit-systems"
    });

    // Check payment
    if (!(req as any).x402?.verified) {
      return res.status(402).json({
        jobId: job.id,
        provider: "merit-systems",
        price_usd: quote.price_usd,
        payment: quote.x402_instructions
      });
    }

    // Execute
    updateJob(job.id, { status: "running" });

    const execResp = await runOnExecutor({
      jobId: job.id,
      code,
      language,
      quote
    });

    updateJob(job.id, { status: "completed", result: execResp });
    return res.json({ jobId: job.id, status: "completed", result: execResp });

  } catch (err: any) {
    updateJob(job.id, { status: "failed", result: { error: err.message } });
    return res.status(500).json({ error: err.message });
  }
});

export default router;
```

**`src/index.ts`**
```typescript
// Update to use new routes
import storeRoutes from "./routes/store.js";
import runRoutes from "./routes/run.js";

// Remove per-endpoint pricing (Quote Engine handles this now)
app.use(
  paymentMiddleware(
    "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
    {}, // No static pricing
    {
      url: "https://x402.org/facilitator",
      // Dynamic pricing mode - middleware checks 402 response from our endpoints
    }
  )
);

app.use("/", storeRoutes);
app.use("/", runRoutes);
```

**`src/services/quoteClient.ts`**
```typescript
// Simplified quote client
export async function getStoreQuotes(params: {
  fileSize: number;
  permanent?: boolean;
  ttl?: number;
}): Promise<Quote[]> {
  const response = await fetch(`${QUOTE_ENGINE_URL}/quote/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  return response.json();
}

export async function getRunQuote(params: {
  codeSize: number;
  language?: string;
}): Promise<Quote> {
  const response = await fetch(`${QUOTE_ENGINE_URL}/quote/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  return response.json();
}
```

**`src/services/executorClient.ts`**
```typescript
// Simplified executor client
export async function runOnExecutor(params: {
  jobId: string;
  data?: any;      // for storage
  code?: string;   // for compute
  filename?: string;
  options?: any;
  language?: string;
  quote: Quote;
}): Promise<any> {
  const taskType = params.data ? "store" : "run";

  const task = {
    jobId: params.jobId,
    taskType,
    provider: params.quote.provider,
    // Map to executor format based on provider
    ...(taskType === "store" ? {
      fileInline: params.data,
      meta: {
        fileName: params.filename,
        operation: params.quote.provider === 'xcache' ? 'set' : 'pin-file',
        ...params.options
      }
    } : {
      fileInline: Buffer.from(params.code).toString('base64'),
      meta: {
        snippet: params.code,
        language: params.language
      }
    })
  };

  const response = await fetch(`${EXECUTOR_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });

  return response.json();
}
```

---

### Quote Engine (`backend/quote`)

#### Files to Create/Modify

**New: `galaksio/x402_client.py`**
```python
"""
x402 Client - makes requests to x402 endpoints to get pricing
"""
import requests
from typing import Dict, Optional

def get_x402_quote(url: str, payload: dict, method: str = 'POST') -> Optional[Dict]:
    """
    Make request to x402 endpoint and extract payment requirements

    Returns:
        dict with price_usd, currency, network, recipient, x402_instructions
    """
    try:
        if method == 'POST':
            resp = requests.post(url, json=payload, timeout=10)
        else:
            resp = requests.get(url, params=payload, timeout=10)

        if resp.status_code == 402:
            headers = resp.headers
            data = resp.json()

            # Extract x402 payment data
            accepts = data.get("accepts", [{}])[0]
            amount = float(accepts.get("maxAmountRequired", 0))

            return {
                "price_usd": amount / 1e6,  # USDC to USD
                "currency": headers.get("asset"),
                "network": headers.get("network"),
                "recipient": headers.get("payTo"),
                "x402_instructions": {
                    "scheme": accepts.get("scheme"),
                    "network": headers.get("network"),
                    "payTo": headers.get("payTo"),
                    "asset": headers.get("asset"),
                    "maxAmountRequired": accepts.get("maxAmountRequired")
                }
            }

        # No payment required
        return {
            "price_usd": 0.0,
            "free": True
        }

    except Exception as e:
        print(f"Error getting x402 quote: {e}")
        return None
```

**Modify: `galaksio/openx402.py`**
```python
from galaksio.x402_client import get_x402_quote
from galaksio.constants import constants

OPENX402_BASE_URL = constants.get("OPENX402_BASE_URL")

def get_openx402_storage_quote(file_size_bytes: int) -> dict:
    """Get quote for IPFS storage via x402"""
    url = f"{OPENX402_BASE_URL}/pin/file"

    # Create minimal payload to get price
    payload = {
        "fileSize": file_size_bytes,
    }

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'openx402'
        quote['file_size_bytes'] = file_size_bytes

    return quote or {"error": "Failed to get quote"}
```

**Modify: `galaksio/x_cache.py`**
```python
from galaksio.x402_client import get_x402_quote

XCACHE_BASE_URL = "https://api.xcache.io"

def get_xcache_storage_quote(file_size_bytes: int, ttl: int = 3600) -> dict:
    """Get quote for cache storage via x402"""
    url = f"{XCACHE_BASE_URL}/set"

    # Create minimal payload to get price
    payload = {
        "size": file_size_bytes,
        "ttl": ttl
    }

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'xcache'
        quote['file_size_bytes'] = file_size_bytes
        quote['ttl'] = ttl

    return quote or {"error": "Failed to get quote"}
```

**New: `galaksio/merit_systems.py`**
```python
from galaksio.x402_client import get_x402_quote

MERIT_SYSTEMS_URL = "https://echo.router.merit.systems/resource/e2b/execute"

def get_merit_systems_quote(code_size_bytes: int) -> dict:
    """Get quote for E2B execution via x402"""
    url = MERIT_SYSTEMS_URL

    # Create minimal payload to get price
    payload = {
        "snippet": "# test",  # minimal test code
        "dryRun": True  # if supported
    }

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'merit-systems'
        quote['code_size_bytes'] = code_size_bytes

    return quote or {"error": "Failed to get quote"}
```

**New: `api/routes_v2.py`**
```python
from fastapi import APIRouter
from pydantic import BaseModel
from galaksio.openx402 import get_openx402_storage_quote
from galaksio.x_cache import get_xcache_storage_quote
from galaksio.merit_systems import get_merit_systems_quote

router = APIRouter()

class StoreQuoteRequest(BaseModel):
    fileSize: int
    permanent: bool = False
    ttl: int = 3600

class RunQuoteRequest(BaseModel):
    codeSize: int
    language: str = "python"

@router.post("/quote/store")
async def get_store_quotes(req: StoreQuoteRequest):
    """Get storage quotes from xCache and IPFS"""
    quotes = []

    if req.permanent:
        # Only try IPFS for permanent storage
        ipfs_quote = get_openx402_storage_quote(req.fileSize)
        if "error" not in ipfs_quote:
            quotes.append(ipfs_quote)
    else:
        # Try both, prefer cheaper
        cache_quote = get_xcache_storage_quote(req.fileSize, req.ttl)
        ipfs_quote = get_openx402_storage_quote(req.fileSize)

        if "error" not in cache_quote:
            quotes.append(cache_quote)
        if "error" not in ipfs_quote:
            quotes.append(ipfs_quote)

    # Sort by price
    quotes.sort(key=lambda q: q.get('price_usd', float('inf')))

    return quotes

@router.post("/quote/run")
async def get_run_quote(req: RunQuoteRequest):
    """Get compute quote from Merit Systems"""
    quote = get_merit_systems_quote(req.codeSize)
    return quote
```

**Modify: `api/main.py`**
```python
from fastapi import FastAPI
from api.routes_v2 import router as v2_router

app = FastAPI(title="Galaksio Quote Engine")

# Add new v2 routes
app.include_router(v2_router, prefix="/v2")

# Keep existing routes for backward compatibility if needed
```

---

### Executor (`backend/executor`)

#### Files to Modify

**`src/index.ts`**
```typescript
// Simplify to handle only our 3 providers
// Map taskType "store" to either xcache or openx402 based on provider
// Map taskType "run" to merit-systems

app.post("/execute", async (req, res) => {
  const task: Task = req.body;

  console.log(
    `[executor] Received task - JobID: ${task.jobId}, TaskType: ${task.taskType}, Provider: ${task.provider}`
  );

  try {
    let result: ExecutorResponse;

    switch (task.taskType) {
      case "store":
        if (task.provider === "xcache") {
          result = await handleXCacheOperation(task, httpayerClient);
        } else if (task.provider === "openx402") {
          result = await handleOpenX402Operation(task, httpayerClient);
        } else {
          throw new Error(`Unsupported storage provider: ${task.provider}`);
        }
        break;

      case "run":
        if (task.provider === "merit-systems") {
          result = await handleMeritSystemsOperation(task, httpayerClient);
        } else {
          throw new Error(`Unsupported compute provider: ${task.provider}`);
        }
        break;

      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }

    return res.json(result);
  } catch (error: any) {
    console.error(`[executor] Error:`, error);
    return res.status(500).json({
      jobId: task.jobId,
      status: "failed",
      error: error.message,
    });
  }
});
```

**`src/handlers/xcache.ts`**
- Simplify to focus on storage operations (create, set, get)
- Remove unnecessary operations like topup, update-ttl
```typescript
// Keep: create, get, set
// Remove or deprecate: delete, list, ttl, update-ttl
```

**`src/handlers/openx402.ts`**
- Focus on pin-file operation (primary use case)
- Keep upload as optional free tier
```typescript
// Primary: pin-file (direct IPFS storage with payment)
// Secondary: upload (free RAM storage)
// Optional: pin, pin-image, pin-json
```

**`src/handlers/meritSystems.ts`**
- No changes needed, already simple
- Just executes code snippets

---

## Migration Path

### Phase 1: Add New Routes (Parallel)
1. Keep existing `/run` endpoint
2. Add new `/store` and `/run` v2 endpoints
3. Add Quote Engine v2 routes
4. Test with both old and new clients

### Phase 2: Client Migration
1. Update documentation
2. Provide migration guide
3. Deprecation notice for old `/run` endpoint

### Phase 3: Cleanup
1. Remove old routes after migration period
2. Remove unused provider integrations (Akash, Arweave, Pinata direct)
3. Simplify executor handlers

---

## Testing Strategy

### Unit Tests
- Quote Engine: Test x402 quote extraction
- Broker: Test size calculation, quote selection
- Executor: Test each provider handler

### Integration Tests
- End-to-end store flow (xCache)
- End-to-end store flow (IPFS)
- End-to-end run flow (Merit Systems)
- Payment verification flow

### Test Scenarios
```bash
# Store file on cheapest provider
curl -X POST http://localhost:8080/store \
  -H "Content-Type: application/json" \
  -d '{"data": "aGVsbG8gd29ybGQ=", "filename": "test.txt"}'

# Response: 402 with payment instructions

# Pay and store
curl -X POST http://localhost:8080/store \
  -H "Content-Type: application/json" \
  -H "x402-payment: <payment-proof>" \
  -d '{"data": "aGVsbG8gd29ybGQ=", "filename": "test.txt"}'

# Response: 200 with storage result

# Run code
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"hello\")", "language": "python"}'

# Response: 402 with payment instructions
```

---

## Configuration Changes

### Environment Variables

**Broker** (`.env`)
```bash
# Broker
PORT=8080
BROKER_WALLET=0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F

# Services
QUOTE_ENGINE_URL=http://localhost:8081
EXECUTOR_URL=http://localhost:8082

# x402
X402_FACILITATOR_URL=https://x402.org/facilitator
```

**Quote Engine** (`.env`)
```bash
PORT=8081

# Provider URLs
XCACHE_BASE_URL=https://api.xcache.io
OPENX402_BASE_URL=https://ipfs.openx402.ai
MERIT_SYSTEMS_URL=https://echo.router.merit.systems/resource/e2b/execute
```

**Executor** (`.env`)
```bash
PORT=8082

# HTTPayer (x402 client)
HTTPAYER_ROUTER_URL=http://localhost:3000

# Provider URLs (same as Quote Engine)
XCACHE_BASE_URL=https://api.xcache.io
OPENX402_BASE_URL=https://ipfs.openx402.ai
MERIT_SYSTEMS_URL=https://echo.router.merit.systems/resource/e2b/execute
```

---

## File Structure (After Refactoring)

```
backend/
├── broker/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── store.ts        # NEW: Storage endpoint
│   │   │   ├── run.ts          # NEW: Compute endpoint
│   │   │   └── status.ts       # Job status
│   │   ├── services/
│   │   │   ├── quoteClient.ts  # MODIFIED: Simplified
│   │   │   └── executorClient.ts # MODIFIED: Simplified
│   │   ├── middleware/
│   │   │   └── x402.ts         # x402 payment verification
│   │   ├── db/
│   │   │   └── jobStore.ts     # Job persistence
│   │   └── index.ts            # MODIFIED: Use new routes
│   └── package.json
│
├── quote/
│   ├── galaksio/
│   │   ├── x402_client.py      # NEW: Generic x402 client
│   │   ├── openx402.py         # MODIFIED: Use x402_client
│   │   ├── x_cache.py          # MODIFIED: Use x402_client
│   │   ├── merit_systems.py    # NEW: Merit Systems quotes
│   │   └── quote_engine.py     # DEPRECATED (keep for backward compat)
│   ├── api/
│   │   ├── routes_v2.py        # NEW: Simplified routes
│   │   └── main.py             # MODIFIED: Add v2 routes
│   └── requirements.txt
│
└── executor/
    ├── src/
    │   ├── handlers/
    │   │   ├── xcache.ts       # SIMPLIFIED: Focus on storage ops
    │   │   ├── openx402.ts     # SIMPLIFIED: Focus on pin-file
    │   │   └── meritSystems.ts # NO CHANGE
    │   ├── client/
    │   │   └── httpayer.ts     # x402 payment client
    │   ├── types.ts            # SIMPLIFIED: Store/Run types
    │   └── index.ts            # MODIFIED: Simplified routing
    └── package.json
```

---

## Success Metrics

- Client request complexity: **90% reduction** (from ~20 fields to ~3 fields)
- Provider integration: **70% reduction** (from 10+ to 3 providers)
- Quote accuracy: **100%** (real-time x402 quotes, not estimates)
- Time to quote: **< 2 seconds** (parallel x402 requests)
- Code maintainability: **Significantly improved** (fewer abstractions)

---

## Open Questions

1. **File size for URL-based uploads**: Should we fetch HEAD first to get size, or fetch full file?
   - **Recommendation**: HEAD request first for size estimation

2. **Free tier handling**: Some providers may not return 402 for small files
   - **Recommendation**: Treat as $0 quote, still track in job store

3. **Quote caching**: Should we cache x402 quotes for similar file sizes?
   - **Recommendation**: Yes, 5-minute cache with size buckets (0-1MB, 1-10MB, etc.)

4. **Provider failover**: What if cheapest provider fails during execution?
   - **Recommendation**: Return error, let client retry (they already paid)
   - **Alternative**: Auto-retry with next cheapest (refund difference?)

5. **Multi-file uploads**: Should we support batch operations?
   - **Recommendation**: Phase 2 feature

---

## Next Steps

1. Review this plan with team
2. Create feature branch: `feature/simplified-broker`
3. Implement Phase 1 (parallel routes)
4. Write integration tests
5. Deploy to staging
6. Client migration (provide SDK/examples)
7. Production deployment
8. Monitor and iterate

---

## Appendix: Example Client Code

### JavaScript Client
```javascript
// Store a file
async function storeFile(fileData, filename) {
  const response = await fetch('http://broker.galaksio.io/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: btoa(fileData),
      filename: filename
    })
  });

  if (response.status === 402) {
    const { payment, jobId } = await response.json();

    // Use x402 client to pay
    const paymentProof = await x402Client.pay(payment);

    // Retry with payment
    const paidResponse = await fetch('http://broker.galaksio.io/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x402-payment': paymentProof
      },
      body: JSON.stringify({
        data: btoa(fileData),
        filename: filename
      })
    });

    return paidResponse.json();
  }

  return response.json();
}

// Run code
async function runCode(code, language = 'python') {
  const response = await fetch('http://broker.galaksio.io/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language })
  });

  if (response.status === 402) {
    const { payment } = await response.json();
    const paymentProof = await x402Client.pay(payment);

    const paidResponse = await fetch('http://broker.galaksio.io/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x402-payment': paymentProof
      },
      body: JSON.stringify({ code, language })
    });

    return paidResponse.json();
  }

  return response.json();
}
```

### Python Client
```python
import requests
import base64

def store_file(file_data: bytes, filename: str):
    url = "http://broker.galaksio.io/store"

    payload = {
        "data": base64.b64encode(file_data).decode(),
        "filename": filename
    }

    response = requests.post(url, json=payload)

    if response.status_code == 402:
        payment_info = response.json()

        # Pay using x402
        payment_proof = x402_client.pay(payment_info['payment'])

        # Retry with payment
        response = requests.post(
            url,
            json=payload,
            headers={'x402-payment': payment_proof}
        )

    return response.json()

def run_code(code: str, language: str = 'python'):
    url = "http://broker.galaksio.io/run"

    payload = {"code": code, "language": language}

    response = requests.post(url, json=payload)

    if response.status_code == 402:
        payment_info = response.json()
        payment_proof = x402_client.pay(payment_info['payment'])

        response = requests.post(
            url,
            json=payload,
            headers={'x402-payment': payment_proof}
        )

    return response.json()
```

# GALAKSIO - COMPREHENSIVE PROJECT AUDIT & V1.0 ROADMAP

**Date:** December 11, 2025  
**Project:** Galaksio Frontend MVP  
**Current State:** Feature/frontend-mvp branch  
**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, Tailwind CSS v4, NextAuth.js

---

## 1. PROJECT OVERVIEW

### Architecture Summary

**Galaksio** is a decentralized compute and storage platform with GitHub integration. The architecture follows a clear separation:

**Frontend (this repo):**
- Next.js 15 App Router with React 19
- GitHub OAuth authentication via NextAuth.js
- Local PostgreSQL database (Prisma) for **UI-only** job tracking and history
- Web3 wallet integration (MetaMask) for x402 payments
- Broker API client (`src/lib/broker.ts`) that handles all x402 payment flows

**Backend (separate - not in this repo):**
- Broker API: Orchestrates compute/storage operations with x402 payment gating
- Quote Engine: Fetches pricing from multiple providers
- Executor: Performs actual compute/storage operations
- **Zero dependency** on frontend database

**Key Architectural Rule (CORRECTLY IMPLEMENTED):**
✅ Frontend DB is UI-only for stats, dashboards, and job history  
✅ Backend is fully driven by x402, job IDs, and dynamic pricing  
✅ Frontend never queries broker directly—uses `broker.ts` helpers  
✅ Backend never depends on frontend database

### Main Modules

```
src/
├── app/
│   ├── api/              # Internal API routes (DB operations)
│   │   ├── auth/         # NextAuth.js GitHub OAuth
│   │   └── jobs/         # Job CRUD operations
│   ├── dashboard/        # Authenticated dashboard pages
│   │   ├── compute/      # Code execution interface
│   │   ├── deployments/  # Job list and detail views
│   │   ├── storage/      # File upload interface
│   │   └── settings/     # User settings (stub)
│   └── page.tsx          # Public landing page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── web3/            # Wallet connection
│   └── GitHubImport.tsx # GitHub repo file browser
├── contexts/            # React contexts (Wallet)
├── lib/                 # Core business logic
│   ├── broker.ts        # ⭐ X402 payment + broker client
│   ├── x402-client.ts   # EIP-3009 payment signing
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Database client
│   └── userAccounts.ts  # User account helpers
├── types/               # TypeScript definitions
└── utils/               # Helper utilities
```

---

## 2. GLOBAL CODE AUDIT

### ✅ Architecture & Separation of Concerns

**STRENGTHS:**

1. **Perfect Frontend-Backend Separation:**
   - `src/lib/broker.ts` is the **single source of truth** for broker communication
   - All x402 payment logic is centralized and hidden from UI components
   - Backend is stateless and doesn't know about frontend DB
   - Job persistence happens **after** broker returns 200 OK

2. **Clean Module Boundaries:**
   - API routes in `/api/jobs/` handle database operations
   - Page components focus on UI/UX
   - Business logic abstracted in `/lib/`
   - Types are well-defined in `/types/broker.ts` and `/types/compute.ts`

3. **Consistent Data Flow:**
   ```
   UI Component → broker.run() → x402 Payment → Broker API → Return jobId
                                                           ↓
                                            /api/jobs/run → Save to DB
   ```

**ISSUES:**

1. **Duplicate Code in Compute API Client** (`src/lib/compute-api.ts`):
   - This file defines a **separate compute backend** that's not used anywhere
   - Creates confusion about which backend to use
   - Should either be removed or clearly documented as legacy/alternative

2. **Storage API Client Unused** (`src/lib/storage-api.ts`):
   - Similar issue—defines Arweave storage client not integrated with broker
   - Either integrate with broker or remove to reduce confusion

3. **Mixed Responsibilities in Page Components:**
   - Pages like `compute/new/page.tsx` have 464 lines with mixed concerns:
     - State management (10+ useState hooks)
     - API calls
     - Form handling
     - UI rendering
   - Should extract custom hooks and separate concerns

**RECOMMENDATION:**
```typescript
// Extract custom hook
// src/hooks/useComputeJob.ts
export function useComputeJob() {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<JobResult | null>(null);
  
  const executeJob = async (params: ExecuteParams) => {
    setExecuting(true);
    try {
      const brokerResult = await broker.run(params);
      await fetch('/api/jobs/run', {
        method: 'POST',
        body: JSON.stringify(brokerResult)
      });
      setResult(brokerResult);
    } finally {
      setExecuting(false);
    }
  };
  
  return { executing, result, executeJob };
}
```

---

### ⚠️ Code Quality & Readability

**ISSUES FOUND:**

1. **High Complexity in `broker.ts` (375 lines):**
   - `brokerRequestWithPayment()` has nested try-catch blocks
   - Deep nesting for 402 handling → payment → retry
   - Debug console.logs should be replaced with proper logging

   **Current:**
   ```typescript
   if (response.status === 402) {
     console.log('[Broker] Payment required, processing X402...');
     try {
       const paymentRequirements = JSON.parse(responseText);
       console.log('[Broker] Payment requirements:', paymentRequirements);
       // ... more nesting
     } catch (err) {
       console.error('[Broker] Failed to parse 402 response:', err);
     }
   }
   ```

   **Better:**
   ```typescript
   if (response.status !== 402) {
     return response.json();
   }
   
   const paymentRequirements = await parsePaymentRequirements(response);
   const paymentHeader = await handlePayment(paymentRequirements);
   return retryWithPayment(url, options, paymentHeader);
   ```

2. **Inconsistent Error Handling:**
   - Some places use `error instanceof Error ? error.message : String(error)`
   - Others use `err: any` with `err?.message`
   - No centralized error handling or error types

3. **Too Many `any` Types:**
   Found 12 instances of `any`:
   - `src/app/api/jobs/route.ts`: `where: any`, `err: any`
   - `src/app/api/jobs/[brokerJobId]/refresh/route.ts`: `result as any`, `updateData: any`
   - `src/lib/x402-client.ts`: `extra?: { [key: string]: any }`

   **Fix:**
   ```typescript
   // Define proper types
   interface PrismaWhereClause {
     userAccountId: string;
     kind?: string;
   }
   
   interface JobUpdateData {
     status: string;
     provider?: string;
     stdout?: string;
     // ... all fields
   }
   ```

4. **Excessive console.log Statements:**
   Found 20+ console.log statements in production code:
   - `src/lib/broker.ts`: 10 debug logs
   - `src/lib/x402-client.ts`: 5 debug logs
   - `src/app/dashboard/compute/new/page.tsx`: 3 error logs

   **Solution:** Implement structured logging:
   ```typescript
   // src/lib/logger.ts
   export const logger = {
     debug: (msg: string, meta?: any) => {
       if (process.env.NODE_ENV === 'development') {
         console.log(`[DEBUG] ${msg}`, meta);
       }
     },
     error: (msg: string, error?: Error) => {
       console.error(`[ERROR] ${msg}`, error);
       // Send to error tracking service in production
     }
   };
   ```

5. **Large Component Files:**
   - `compute/new/page.tsx`: 464 lines
   - `storage/page.tsx`: 611 lines
   - `deployments/[jobId]/page.tsx`: 623 lines

   These should be split into smaller, focused components.

---

### 🔒 Error Handling & Robustness

**CRITICAL ISSUES:**

1. **No Global Error Boundary:**
   - React errors crash the entire app
   - No user-friendly error messages
   - Need Next.js error.tsx files

   **Add:**
   ```tsx
   // src/app/error.tsx
   'use client';
   
   export default function Error({ error, reset }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-center">
           <h2>Something went wrong!</h2>
           <button onClick={reset}>Try again</button>
         </div>
       </div>
     );
   }
   ```

2. **API Routes Have Inconsistent Error Responses:**
   - `/api/jobs/route.ts`: Returns `{ error, details }`
   - `/api/jobs/run/route.ts`: Returns `{ error, details }`
   - `/api/jobs/[brokerJobId]/refresh/route.ts`: Returns `{ error }` only

   **Standardize:**
   ```typescript
   interface APIError {
     error: string;
     message: string;
     code?: string;
     statusCode: number;
   }
   ```

3. **No Retry Logic for Failed API Calls:**
   - Network failures in job listing immediately fail
   - Should retry with exponential backoff

4. **Wallet Connection Errors Not Handled:**
   - `WalletContext.tsx` catches errors but doesn't distinguish between:
     - User rejection
     - Network errors
     - MetaMask not installed
     - Wrong network

   **Improve:**
   ```typescript
   try {
     const accounts = await window.ethereum.request({
       method: 'eth_requestAccounts',
     });
   } catch (error: any) {
     if (error.code === 4001) {
       toast.error('Please approve wallet connection');
     } else if (error.code === -32002) {
       toast.error('Wallet connection request pending');
     } else {
       toast.error('Failed to connect wallet');
     }
   }
   ```

5. **Missing Input Validation in API Routes:**
   - `/api/jobs/run/route.ts` doesn't validate broker response shape
   - `/api/jobs/store/route.ts` assumes response fields exist
   - No schema validation (should use Zod)

   **Add:**
   ```typescript
   import { z } from 'zod';
   
   const BrokerRunResponseSchema = z.object({
     jobId: z.string(),
     status: z.string(),
     result: z.object({
       stdout: z.string(),
       stderr: z.string(),
       exitCode: z.number(),
       executionTime: z.number()
     })
   });
   
   export async function POST(req: NextRequest) {
     const body = await req.json();
     const validated = BrokerRunResponseSchema.parse(body); // Throws on invalid
     // ... use validated data
   }
   ```

---

### ⚡ Performance

**ISSUES:**

1. **Unnecessary Re-renders in Dashboard Components:**
   - `dashboard/page.tsx` fetches jobs on every render when session changes
   - Should use `useMemo` or React Query for caching

   ```typescript
   // Current: refetches every time
   useEffect(() => {
     if (session) {
       loadJobs();
     }
   }, [session]);
   
   // Better: use SWR or React Query
   const { data: jobs, isLoading } = useSWR(
     session ? '/api/jobs' : null,
     fetcher
   );
   ```

2. **No Data Pagination:**
   - `/api/jobs/route.ts` limits to 100 jobs hardcoded
   - Should implement cursor-based pagination
   - Large job lists will slow down UI

3. **Redundant State in Compute Page:**
   - Stores both `executionResult` and loads from API in `recentJobs`
   - After execution, the new job is fetched again from API
   - Should optimistically update local state

4. **Missing Debouncing in GitHub Import Search:**
   - `GitHubImport.tsx` filters on every keystroke
   - Should debounce search input

   ```typescript
   import { useMemo } from 'react';
   import { debounce } from 'lodash';
   
   const debouncedSearch = useMemo(
     () => debounce((query: string) => {
       setFilteredFiles(files.filter(/* ... */));
     }, 300),
     [files]
   );
   ```

5. **Large Bundle Size Potential:**
   - Importing entire `viem` library but only using small parts
   - Should use tree-shaking or lighter alternatives

---

### 🔐 Security & Validation

**CRITICAL SECURITY ISSUES:**

1. **No Input Sanitization in Code Execution:**
   - `compute/new/page.tsx` sends user code directly to broker
   - No validation of code content
   - Should warn users about executing untrusted code
   - Add code size limits

   ```typescript
   const MAX_CODE_SIZE = 100_000; // 100KB
   
   if (code.length > MAX_CODE_SIZE) {
     toast.error('Code exceeds maximum size');
     return;
   }
   ```

2. **No File Size Validation in Storage Upload:**
   - `storage/page.tsx` allows unlimited file uploads
   - Should check file size before upload
   - Add file type validation

   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   
   if (selectedFile.size > MAX_FILE_SIZE) {
     toast.error('File size exceeds 10MB limit');
     return;
   }
   
   const allowedTypes = ['image/*', 'text/*', 'application/json'];
   if (!allowedTypes.some(type => selectedFile.type.match(type))) {
     toast.warning('File type not recommended');
   }
   ```

3. **Sensitive Data in Console Logs:**
   - Payment headers logged in `broker.ts` and `x402-client.ts`
   - Should never log payment data in production

4. **No CSRF Protection:**
   - API routes are unprotected
   - NextAuth.js provides CSRF tokens, but custom routes don't use them
   - Should validate session on all mutation endpoints

5. **localStorage Used for Wallet Address:**
   - `WalletContext.tsx` stores wallet address in localStorage
   - Potential XSS vector if combined with other vulnerabilities
   - Consider using httpOnly cookies for sensitive data

6. **Environment Variables Exposed to Client:**
   - `NEXT_PUBLIC_BROKER_API_URL` is client-side
   - Attacker could see backend URL
   - Consider proxying through Next.js API routes to hide backend

---

### 🧪 Tests

**STATUS: ❌ NO TESTS FOUND**

- Zero unit tests
- Zero integration tests
- Zero E2E tests

**CRITICAL FLOWS THAT NEED TESTS:**

1. **Broker Integration (`broker.ts`):**
   - x402 payment flow
   - 402 handling and retry
   - Error scenarios (network failure, invalid payment)

2. **API Routes:**
   - `/api/jobs` - list jobs
   - `/api/jobs/run` - save compute job
   - `/api/jobs/store` - save storage job
   - `/api/jobs/[brokerJobId]/refresh` - sync with broker

3. **Authentication:**
   - GitHub OAuth flow
   - Session handling
   - User account creation

4. **Wallet Integration:**
   - Connect/disconnect
   - Network switching
   - Payment signing

**RECOMMENDED TEST SETUP:**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test # For E2E
```

```typescript
// Example test
// src/lib/__tests__/broker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { broker } from '../broker';

describe('broker.run()', () => {
  it('should handle 402 payment flow', async () => {
    // Mock fetch to return 402, then 200
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        status: 402,
        text: async () => JSON.stringify({ x402Version: 1, accepts: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'test-123', status: 'completed' })
      });
    
    const result = await broker.run({ code: 'print("test")', language: 'python' });
    expect(result.jobId).toBe('test-123');
  });
});
```

---

## 3. FRONTEND V1.0 IMPROVEMENTS

### Component Structure Analysis

**CURRENT STATE:**

```
components/
├── ui/                    # ✅ Well-organized shadcn/ui components
├── web3/
│   └── WalletConnect.tsx  # ✅ Clean, focused component
├── dashboard/
│   └── DashboardSidebar.tsx # ⚠️ 150 lines, could extract sub-components
├── AuthProvider.tsx       # ✅ Simple wrapper
├── GitHubImport.tsx      # ⚠️ 272 lines, complex state management
└── NavbarNew.tsx         # ⚠️ Manual dropdown instead of headlessui
```

**ISSUES:**

1. **GitHubImport.tsx is Too Complex:**
   - 272 lines with 8 state variables
   - Handles API calls, filtering, UI rendering
   - Should be split into:
     - `useGitHubRepos` hook
     - `RepoSelector` component
     - `FileList` component
     - `SearchInput` component

2. **Page Components Mix Concerns:**
   - Compute, Storage, Deployments pages are 400-600 lines
   - Each has similar patterns: loading → fetching → displaying
   - Should extract reusable patterns

3. **No Shared Layout Components:**
   - Dashboard pages repeat similar card structures
   - No consistent empty states
   - No shared loading skeletons

**RECOMMENDATIONS:**

#### Create Shared Dashboard Components

```tsx
// src/components/dashboard/DashboardCard.tsx
export function DashboardCard({ 
  title, 
  description, 
  children, 
  actions 
}: DashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// src/components/dashboard/EmptyState.tsx
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 mx-auto text-zinc-400" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      {action}
    </div>
  );
}
```

#### Extract Custom Hooks

```typescript
// src/hooks/useJobs.ts
export function useJobs(kind?: string) {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const url = kind ? `/api/jobs?kind=${kind}` : '/api/jobs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load jobs');
      setJobs(await res.json());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return { jobs, loading, error, reload: loadJobs };
}

// Usage in component
const { jobs, loading, error, reload } = useJobs('run');
```

---

### State Management Issues

**CURRENT:**
- 30+ `useState` hooks across pages
- No global state management (except WalletContext)
- Redundant API calls

**ISSUES:**

1. **Duplicate Job Lists:**
   - Dashboard page fetches all jobs
   - Deployments page fetches all jobs
   - Compute page fetches run jobs
   - Storage page doesn't fetch its own jobs
   - Should use shared state or SWR

2. **No Caching:**
   - Every page navigation refetches data
   - Should implement SWR or React Query

**RECOMMENDATION:**

```typescript
// Install SWR
npm install swr

// src/lib/swr-hooks.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useJobs(kind?: string) {
  const url = kind ? `/api/jobs?kind=${kind}` : '/api/jobs';
  const { data, error, mutate } = useSWR<JobRecord[]>(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30s
    revalidateOnFocus: true
  });
  
  return {
    jobs: data ?? [],
    loading: !error && !data,
    error,
    reload: mutate
  };
}

// Usage
const { jobs, loading, error, reload } = useJobs('run');
```

---

### Form Validation & UX

**ISSUES:**

1. **No Form Validation Library:**
   - Manual validation in each component
   - Inconsistent error messages
   - Should use React Hook Form + Zod

2. **Poor Loading States:**
   - Some buttons just say "Loading..."
   - No skeleton loaders
   - Jarring UX when fetching data

3. **Inconsistent Toast Messages:**
   - Some places: "Failed to load"
   - Others: "Error loading jobs"
   - Should standardize messages

**RECOMMENDATIONS:**

#### Use React Hook Form

```typescript
// Install
npm install react-hook-form @hookform/resolvers

// src/app/dashboard/compute/new/page.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const computeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(100000, 'Code too large'),
  language: z.enum(['python', 'javascript']),
  gpuType: z.enum(['l40s', 'a100']),
  timeout: z.number().min(1).max(3600)
});

type ComputeForm = z.infer<typeof computeSchema>;

export default function ComputePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ComputeForm>({
    resolver: zodResolver(computeSchema),
    defaultValues: {
      code: EXAMPLE_CODE.python,
      language: 'python',
      gpuType: 'l40s',
      timeout: 300
    }
  });

  const onSubmit = async (data: ComputeForm) => {
    // Validated data
    const result = await broker.run(data);
  };
}
```

#### Add Loading Skeletons

```tsx
// src/components/ui/skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-zinc-200 rounded", className)} />
  );
}

// Usage in job list
{loading ? (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
) : (
  <JobList jobs={jobs} />
)}
```

---

### Developer Experience (DX)

**IMPROVEMENTS NEEDED:**

1. **Add Type Safety for API Routes:**
   ```typescript
   // src/types/api.ts
   export type APIResponse<T> = 
     | { success: true; data: T }
     | { success: false; error: string; message: string };
   
   // Typed API client
   async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
     const res = await fetch(url, options);
     if (!res.ok) {
       const error = await res.json();
       throw new Error(error.message || 'API request failed');
     }
     return res.json();
   }
   ```

2. **Better TypeScript Configuration:**
   - Enable `noUncheckedIndexedAccess`
   - Enable `noImplicitReturns`
   - Remove `skipLibCheck` in production

3. **Add ESLint Rules:**
   ```json
   {
     "rules": {
       "no-console": "warn",
       "@typescript-eslint/no-explicit-any": "error",
       "@typescript-eslint/no-unused-vars": "error"
     }
   }
   ```

4. **Environment Variables Type Safety:**
   ```typescript
   // src/env.ts
   import { z } from 'zod';
   
   const envSchema = z.object({
     NEXT_PUBLIC_BROKER_API_URL: z.string().url(),
     DATABASE_URL: z.string(),
     GITHUB_CLIENT_ID: z.string(),
     GITHUB_CLIENT_SECRET: z.string(),
   });
   
   export const env = envSchema.parse(process.env);
   ```

---

### UI/UX Improvements

**CRITICAL UX ISSUES:**

1. **No Feedback During Long Operations:**
   - Code execution can take minutes
   - File upload has no progress bar
   - Should show progress/status updates

2. **Unclear States:**
   - When is a job "queued" vs "running" vs "completed"?
   - Should add status badges with clear visual hierarchy

3. **Missing Features:**
   - No job cancellation
   - No ability to re-run failed jobs
   - No file download for storage results
   - No code syntax highlighting

4. **Accessibility Issues:**
   - No keyboard navigation in file browser
   - Missing ARIA labels
   - Poor color contrast in some areas

**RECOMMENDATIONS:**

#### Add Job Status Component

```tsx
export function JobStatusBadge({ status }: { status: string }) {
  const variants = {
    completed: { color: 'green', icon: CheckCircle, label: 'Completed' },
    running: { color: 'blue', icon: Loader2, label: 'Running' },
    failed: { color: 'red', icon: XCircle, label: 'Failed' },
    queued: { color: 'yellow', icon: Clock, label: 'Queued' }
  };
  
  const config = variants[status.toLowerCase()] ?? variants.queued;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
```

#### Add Code Editor with Syntax Highlighting

```bash
npm install @monaco-editor/react
```

```tsx
import Editor from '@monaco-editor/react';

<Editor
  height="400px"
  language={language}
  value={code}
  onChange={setCode}
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    fontSize: 14
  }}
/>
```

#### Add File Upload Progress

```tsx
const [uploadProgress, setUploadProgress] = useState(0);

const handleUpload = async () => {
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    const percent = (e.loaded / e.total) * 100;
    setUploadProgress(percent);
  });
  
  xhr.addEventListener('load', () => {
    // Upload complete
  });
  
  xhr.open('POST', '/api/upload');
  xhr.send(formData);
};
```

---

## 4. MVP → PRODUCTION V1.0 ROADMAP

### [CRITICAL] - Must Fix Before Production

#### Backend & x402 Integration

- [ ] **Remove duplicate API clients** (`compute-api.ts`, `storage-api.ts`)
  - **Why:** Creates confusion about which backend to use
  - **File:** `src/lib/compute-api.ts`, `src/lib/storage-api.ts`
  - **Action:** Delete or clearly document as unused/alternative

- [ ] **Add structured logging instead of console.log**
  - **Why:** Production debugging is impossible with console.logs
  - **Files:** `src/lib/broker.ts`, `src/lib/x402-client.ts`
  - **Action:** Create `src/lib/logger.ts` with environment-aware logging

- [ ] **Validate broker responses with Zod schemas**
  - **Why:** Prevents runtime errors from malformed API responses
  - **Files:** `src/app/api/jobs/run/route.ts`, `src/app/api/jobs/store/route.ts`
  - **Action:** Add Zod validation before database operations

#### Security

- [ ] **Add input validation to all API routes**
  - **Why:** Prevent injection attacks and data corruption
  - **Files:** All `/api/jobs/*` routes
  - **Action:** Use Zod schemas for request body validation

- [ ] **Implement file size limits for storage uploads**
  - **Why:** Prevent DoS attacks and excessive costs
  - **File:** `src/app/dashboard/storage/page.tsx`
  - **Action:** Add 10MB file size check before upload

- [ ] **Add code size limits for compute jobs**
  - **Why:** Prevent abuse and excessive execution costs
  - **File:** `src/app/dashboard/compute/new/page.tsx`
  - **Action:** Add 100KB code size limit

- [ ] **Remove payment data from production logs**
  - **Why:** Security/privacy compliance
  - **Files:** `src/lib/broker.ts`, `src/lib/x402-client.ts`
  - **Action:** Wrap debug logs in `if (process.env.NODE_ENV === 'development')`

- [ ] **Add CSRF protection to mutation endpoints**
  - **Why:** Prevent cross-site request forgery
  - **Files:** All API routes
  - **Action:** Validate NextAuth session tokens on POST/PATCH/DELETE

#### Error Handling & Observability

- [ ] **Add global error boundaries**
  - **Why:** Prevent full app crashes, show user-friendly errors
  - **Files:** `src/app/error.tsx`, `src/app/dashboard/error.tsx`
  - **Action:** Create error.tsx files at each route level

- [ ] **Standardize API error responses**
  - **Why:** Consistent error handling in frontend
  - **Files:** All `/api/*` routes
  - **Action:** Create `src/lib/api-error.ts` with error factory

- [ ] **Add retry logic for network failures**
  - **Why:** Improve reliability for transient failures
  - **Files:** Components that fetch data
  - **Action:** Use SWR with retry configuration

- [ ] **Implement error tracking service**
  - **Why:** Monitor production errors
  - **Action:** Add Sentry or similar error tracking

---

### [HIGH] - Very Important But Not Blocking

#### Frontend Architecture

- [ ] **Extract custom hooks from page components**
  - **Why:** Reduce complexity, improve reusability
  - **Files:** `compute/new/page.tsx`, `storage/page.tsx`, `deployments/page.tsx`
  - **Action:** Create `src/hooks/useJobs.ts`, `src/hooks/useComputeJob.ts`

- [ ] **Split large components into smaller ones**
  - **Why:** Improve maintainability and testability
  - **Files:** `GitHubImport.tsx` (272 lines), page components (400-600 lines)
  - **Action:** Extract sub-components and hooks

- [ ] **Implement SWR or React Query for data fetching**
  - **Why:** Eliminate redundant API calls, add caching
  - **Files:** All dashboard pages
  - **Action:** Replace useState + useEffect with useSWR

- [ ] **Create shared dashboard components**
  - **Why:** Consistent UX, less code duplication
  - **Action:** Create `DashboardCard`, `EmptyState`, `LoadingSkeleton` components

#### Code Quality

- [ ] **Remove all `any` types**
  - **Why:** Type safety prevents runtime errors
  - **Files:** Found in 12 files (see audit above)
  - **Action:** Define proper interfaces for all data structures

- [ ] **Refactor broker.ts to reduce complexity**
  - **Why:** Easier to understand and maintain
  - **File:** `src/lib/broker.ts`
  - **Action:** Extract `handleX402Payment()` and `retryWithPayment()` functions

- [ ] **Add ESLint rules for code quality**
  - **Why:** Enforce best practices automatically
  - **File:** `eslint.config.mjs`
  - **Action:** Add `no-console`, `no-explicit-any`, `no-unused-vars` rules

#### Frontend UX

- [ ] **Add loading skeletons for all data fetching**
  - **Why:** Better perceived performance
  - **Files:** Dashboard pages
  - **Action:** Create Skeleton component, use during loading states

- [ ] **Add job status badges with clear visual hierarchy**
  - **Why:** Users need to understand job states at a glance
  - **Files:** Job list components
  - **Action:** Create `JobStatusBadge` component

- [ ] **Add syntax highlighting for code editor**
  - **Why:** Professional developer experience
  - **File:** `compute/new/page.tsx`
  - **Action:** Replace textarea with Monaco Editor

- [ ] **Add file upload progress indicators**
  - **Why:** Users need feedback for long uploads
  - **File:** `storage/page.tsx`
  - **Action:** Implement XMLHttpRequest with progress events

---

### [MEDIUM] - Nice to Have

#### Tests & Tooling

- [ ] **Set up testing infrastructure**
  - **Why:** Prevent regressions as codebase grows
  - **Action:** Install Vitest, Testing Library, Playwright
  - **Priority:** Write tests for `broker.ts` and API routes first

- [ ] **Add unit tests for broker integration**
  - **Why:** Most critical flow in the app
  - **File:** `src/lib/__tests__/broker.test.ts`
  - **Action:** Test x402 payment flow, error scenarios

- [ ] **Add integration tests for API routes**
  - **Why:** Ensure database operations work correctly
  - **Files:** `src/app/api/**/__tests__/*.test.ts`
  - **Action:** Test CRUD operations for jobs

- [ ] **Add E2E tests for critical user flows**
  - **Why:** Catch integration bugs before production
  - **Action:** Test GitHub login → import code → execute → view results

#### Frontend Features

- [ ] **Add job cancellation**
  - **Why:** Users may want to stop long-running jobs
  - **Action:** Add DELETE endpoint + UI button

- [ ] **Add "Re-run" button for failed jobs**
  - **Why:** Convenient for debugging and retrying
  - **Action:** Pre-fill form with previous job parameters

- [ ] **Add file download for storage results**
  - **Why:** Users need to retrieve uploaded files
  - **File:** `storage/page.tsx`
  - **Action:** Add download button with IPFS gateway link

- [ ] **Add keyboard shortcuts for common actions**
  - **Why:** Power users appreciate keyboard navigation
  - **Action:** Cmd+K for command palette, Cmd+Enter to execute

- [ ] **Add dark mode support**
  - **Why:** Modern UX expectation
  - **Action:** Use next-themes (already installed) + Tailwind dark: variants

#### Performance

- [ ] **Implement pagination for job lists**
  - **Why:** Prevent slow UI with thousands of jobs
  - **File:** `src/app/api/jobs/route.ts`
  - **Action:** Add cursor-based pagination

- [ ] **Add debouncing to search inputs**
  - **Why:** Reduce unnecessary re-renders
  - **File:** `GitHubImport.tsx`
  - **Action:** Use lodash.debounce or custom hook

- [ ] **Optimize bundle size**
  - **Why:** Faster page loads
  - **Action:** Analyze bundle with `@next/bundle-analyzer`, tree-shake viem

---

### [LOW] - Polish / Future Ideas

#### UI Polish

- [ ] **Add animations and transitions**
  - **Why:** Polished feel
  - **Action:** Use Framer Motion for page transitions

- [ ] **Improve accessibility (WCAG 2.1 AA)**
  - **Why:** Inclusive design
  - **Action:** Add ARIA labels, keyboard navigation, color contrast fixes

- [ ] **Add onboarding tour for new users**
  - **Why:** Reduce learning curve
  - **Action:** Use react-joyride or similar

#### Advanced Features

- [ ] **Add code execution history with diff view**
  - **Why:** Track changes over time
  - **Action:** Compare code between job runs

- [ ] **Add collaborative features (share jobs)**
  - **Why:** Team workflows
  - **Action:** Generate shareable links for jobs

- [ ] **Add job scheduling/cron jobs**
  - **Why:** Automated workflows
  - **Action:** Integrate with cron service

- [ ] **Add webhook support for job completion**
  - **Why:** Integration with other services
  - **Action:** Add webhook URL field, POST results on completion

---

## SUMMARY

### What's Working Well ✅

1. **Architecture is solid:** Clean separation between frontend DB and backend
2. **x402 integration is correct:** Centralized in `broker.ts`, hidden from UI
3. **Type safety is good:** Most code uses proper TypeScript types
4. **UI components are clean:** shadcn/ui provides solid foundation
5. **Authentication works:** GitHub OAuth properly integrated

### Critical Fixes Needed 🚨

1. **Security:** Input validation, file size limits, CSRF protection
2. **Error Handling:** Global error boundaries, standardized API errors
3. **Code Quality:** Remove `any` types, reduce console.logs, refactor large components
4. **Testing:** Zero tests—need unit, integration, and E2E tests

### Priority Order for V1.0 🎯

1. **Week 1:** Security fixes (input validation, size limits, CSRF)
2. **Week 2:** Error handling (error boundaries, API standardization, retry logic)
3. **Week 3:** Code quality (remove `any`, refactor broker.ts, ESLint rules)
4. **Week 4:** Testing infrastructure (Vitest, broker tests, API tests)
5. **Week 5:** Frontend improvements (custom hooks, SWR, shared components)
6. **Week 6:** UX polish (loading states, status badges, syntax highlighting)

### Estimated Effort 📊

- **Critical fixes:** ~40 hours
- **High priority:** ~60 hours
- **Medium priority:** ~80 hours
- **Low priority:** ~40 hours
- **Total to v1.0:** ~220 hours (~6 weeks at 40h/week)

---

## CONCLUSION

This audit provides a clear, actionable roadmap to transform Galaksio from an MVP to a production-ready v1.0 platform. The architecture is fundamentally sound—the work ahead is about hardening security, improving developer experience, and polishing the user experience.

**Key Takeaways:**

1. **The core architecture is correct** - Frontend/backend separation is properly implemented
2. **Security needs immediate attention** - Input validation and size limits are critical
3. **Code quality is good but can improve** - Remove `any` types, add proper logging
4. **Testing is the biggest gap** - Zero tests is a major risk for production
5. **UX polish will make it shine** - Loading states, status indicators, syntax highlighting

The project is well-positioned for success. With focused effort on the critical and high-priority items, Galaksio can reach production quality within 6 weeks.

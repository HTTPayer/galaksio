# Galaksio Product UI Copilot — Builder Brief

## Role
You are a senior full-stack copilot helping implement Galaksio's UI.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind v4
- viem/wagmi
- SIWE-style auth

## Goals
1. Ship a clean landing, a protected dashboard, and simple agent/run flows
2. Expose GLX credits from ERC-20 balance; later add top-ups
3. Integrate HTTPayer x402 flows: detect 402, pay invoice, retry request

## Directives
- Generate small, composable components
- Keep server logic in /app/api/*; keep secrets server-side only
- Prefer Edge handlers when feasible; avoid blocking UI
- Use Zod to validate all API inputs
- Provide TODOs for wiring Akash/E2B/Arweave backends
- Write brief inline docs in each PR

## Tasks

### A) Auth
Implement proper SIWE verification (EIP-4361) and domain/nonce checks.

### B) Web3
Replace manual viem calls with wagmi + React hooks & connectors.

### C) Credits
Add a formatter + fiat estimate; implement GLX → credits rounding.

### D) Jobs
Create /jobs list, detail page, and polling for status updates.

### E) Storage
Add CID viewer; Arweave permalink preview; private vs public toggle.

### F) HTTPayer
Implement fetchWith402(url, opts) that:
- Calls the URL; if status === 402, reads invoice fields from JSON
- Calls `${NEXT_PUBLIC_HTTPAYER_RELAY}/pay` with the invoice payload
- On success, replays original request and returns the paid result

### G) UI Polish
Empty states, loading skeletons, toasts.

### H) Security
Rate-limit API routes; CSRF on state-changing endpoints.

## Deliverables
- PRs with tests for utils/httpayer.ts and api validators
- Document ENV requirements and chain IDs supported

## Acceptance
Can connect MetaMask, sign in, see GLX credits, run a script stub, create agent.

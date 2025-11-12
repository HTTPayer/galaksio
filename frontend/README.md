# Galaksio UIThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Next.js App Router blueprint for Galaksio - On-chain USDC → Instant cloud compute & storage## Getting Started



## Tech StackFirst, run the development server:



- **Next.js 15** (App Router)```bash

- **TypeScript**npm run dev

- **Tailwind CSS v4**# or

- **viem/wagmi** - Ethereum interactionsyarn dev

- **SIWE** - Sign-In with Ethereum# or

- **jose** - JWT handlingpnpm dev

- **zod** - Validation# or

- **zustand** - State managementbun dev

```

## Features

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- 🔐 MetaMask authentication via SIWE

- 🔒 Protected routes (/dashboard, /agents)You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- 💰 GLX credits from ERC-20 balance

- 🤖 Agent creation modalsThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- 📜 Script execution via HTTPayer

- 💳 x402 Payment Required flow integration## Learn More



## Quick StartTo learn more about Next.js, take a look at the following resources:



### 1. Install dependencies- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

```bash

npm installYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

```

## Deploy on Vercel

### 2. Set environment variables

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Create a `.env.local` file:

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```env
NEXT_PUBLIC_CHAIN_ID=8453           # Base mainnet (or 84532 for Base Sepolia)
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_GLX_TOKEN=0x...        # GLX ERC20 address on selected chain
SIWE_JWT_SECRET=...               # Strong secret for JWT signing
NEXT_PUBLIC_HTTPAYER_RELAY=https://relay.httpayer.com
NEXT_PUBLIC_GALAKSIO_API=https://api.galaksio.cloud
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Test the flow

1. Connect MetaMask → Sign message
2. Visit `/dashboard` to see GLX credits
3. Click "Run Script" (stub) or "Create Agent" (stub)

## Project Structure

```
galaksio/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── siwe/          # SIWE authentication endpoints
│   │   │   └── galaksio/      # Galaksio API stubs
│   │   ├── dashboard/         # Protected dashboard
│   │   ├── layout.tsx         # Root layout with Navbar/Footer
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── product/           # Product modals
│   │   ├── ui/                # UI components
│   │   └── web3/              # Web3 components
│   ├── hooks/
│   │   └── useGLXBalance.ts   # GLX ERC-20 balance hook
│   ├── lib/
│   │   └── jwt.ts             # JWT utilities
│   ├── utils/
│   │   ├── cn.ts              # Class name utility
│   │   └── httpayer.ts        # HTTPayer 402 flow handler
│   └── middleware.ts          # Route protection
├── .env.local                 # Environment variables (create this)
└── package.json
```

## Next Steps

### TODOs for Production

- [ ] **Auth**: Implement proper SIWE verification (EIP-4361) with domain/nonce checks
- [ ] **Web3**: Replace manual viem calls with wagmi + React hooks & connectors
- [ ] **Credits**: Add formatter + fiat estimate; implement GLX → credits rounding
- [ ] **Jobs**: Create `/jobs` list, detail page, and polling for status updates
- [ ] **Storage**: Add CID viewer; Arweave permalink preview; private vs public toggle
- [ ] **HTTPayer**: Wire real 402 Payment Required flows with invoice handling
- [ ] **UI Polish**: Empty states, loading skeletons, toasts
- [ ] **Security**: Rate-limit API routes; CSRF on state-changing endpoints
- [ ] **Backend**: Wire Akash/E2B, Arweave/IPFS, and real HTTPayer endpoints

## HTTPayer Integration

The `fetchWith402` utility in `src/utils/httpayer.ts` provides a client-side handler for the x402 Payment Required flow:

1. Calls the URL; if status === 402, reads invoice fields from JSON
2. Calls `${NEXT_PUBLIC_HTTPAYER_RELAY}/pay` with the invoice payload
3. On success, replays original request and returns the paid result

Example usage:

```typescript
import { fetchWith402 } from "@/utils/httpayer";

const response = await fetchWith402("https://api.galaksio.cloud/run", {
  method: "POST",
  body: JSON.stringify({ script: "print('hello')" }),
});
```

## Environment Support

Supported chains:
- Base mainnet (8453)
- Base Sepolia (84532)
- Ethereum mainnet (1)
- Custom chains via configuration

## License

All rights reserved © 2025 Galaksio

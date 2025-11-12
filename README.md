# Galaksio — Pay-as-You-Go Cloud Compute + Storage via HTTPayer

## Summary

Galaksio turns on-chain USDC payments into *instant access* to cloud compute and storage resources.

Users can:
- **Run scripts or AI jobs** securely in decentralized sandboxes (Akash, E2B, or similar)
- **Store data or results** in permanent storage (Arweave) or ephemeral caches (IPFS/Filecoin)
- **Pay only for what they use** — no wallets, accounts, or manual gas handling

All payments flow through **HTTPayer**, a payment router for the emerging **x402 “Payment Required” standard**, making Web3 resources accessible through simple HTTP calls.

## Problem

Cloud compute and storage today are:
- **Centralized & siloed** — controlled by AWS/GCP billing.
- **Subscription-based** — users overpay for idle capacity.
- **Non-verifiable** — no cryptographic proof of data persistence or execution.

Meanwhile, decentralized compute (Akash) and storage (Arweave, Filecoin) exist — but onboarding, payments, and UX remain a barrier for mainstream users.

## Roadmap

| Phase | Deliverable | Status |
| --- | --- | --- |
| **Phase 1 (Hackathon)** | Working x402 Galaksio endpoint + HTTPayer CLI flow | 🟢 In progress |
| **Phase 2** | Integrate Arweave storage, group exports, and Notion sync | 🔜 Planned |
| **Phase 3** | Add Akash compute and prepaid credit system | 🔜 Planned |
| **Phase 4** | Publish open API registry + hosted router | 🔜 Post-hackathon |

## Why This Matters

Galaksio demonstrates the **practical future of Web3 payments**:

> “No wallets. No gas. Just pay and use.”

By abstracting all crypto complexity behind HTTPayer, it makes **x402-gated decentralized infrastructure accessible to Web2 developers** — from AI researchers to fintech firms — turning on-chain resources into a pay-per-use global cloud.

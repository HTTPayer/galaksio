"use client";
import Link from "next/link";
import Providers from "@/components/Providers";

export default function LandingPage() {
  return (
    <Providers>
      <div className="bg-white text-zinc-900">
      {/* Hero */}
      <section className="bg-gradient-to-b from-white via-zinc-50 to-zinc-100 border-b">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                On‑chain USDC → Instant cloud compute & storage
              </h1>
              <p className="mt-4 text-lg text-zinc-600">
                Run scripts or AI jobs, store results on Arweave/IPFS, and pay only for what you use. Powered by HTTPayer and the x402 Payment Required standard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard" className="rounded-xl bg-black px-5 py-2.5 text-white">
                  Open Dashboard
                </Link>
                <a href="#how" className="rounded-xl border px-5 py-2.5">
                  How it works
                </a>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="text-sm text-zinc-600">HTTPayer request example</div>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-sm text-zinc-800">
{`# Execute a Python script
galaksio run analyze_data.py

# Store results permanently
galaksio store results.json --permanent`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { title: "Decentralized sandboxes", desc: "Akash, E2B or similar secure compute for AI and scripts." },
              { title: "Verifiable storage", desc: "Arweave permanence or IPFS/Filecoin caches with CIDs." },
              { title: "Pay per run", desc: "USDC via HTTPayer — no wallets for end users, just HTTP." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border p-6 bg-white">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-zinc-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-b bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-semibold">Unified pay‑as‑you‑go flow</h2>
          <ol className="mt-6 space-y-3 text-zinc-700">
            <li>1) Service returns 402 Payment Required → HTTPayer pays USDC</li>
            <li>2) Job runs on Akash/E2B sandbox</li>
            <li>3) Output stored on Arweave/IPFS</li>
            <li>4) Logs available via HTTPayer Response Groups</li>
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-semibold">Pricing</h2>
          <p className="mt-2 text-zinc-600">Pay as you go with GLX credits. Bring your own USDC; credits top‑up coming soon.</p>
        </div>
      </section>
      </div>
    </Providers>
  );
}

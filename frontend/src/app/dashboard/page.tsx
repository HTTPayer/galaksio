"use client";
import { useState } from "react";
import { useCdpSolana } from "@/hooks/useCdpSolana";
import { useGLXBalance } from "@/hooks/useGLXBalance";
import { useSession } from "@/hooks/useSession";
import { CreateAgentModal } from "@/components/product/CreateAgentModal";
import { RunScriptModal } from "@/components/product/RunScriptModal";

export default function DashboardPage() {
  const { address: solanaAddressFromCdp } = useCdpSolana();
  // `useSession` returns { status, userId } — not an `address`. Use `userId`
  // as a fallback value here (minimal change to fix types). The CDP hook
  // `useCdpSolana` remains the primary source for a Solana address.
  const { userId: solanaAddressFromSession } = useSession();
  const solanaAddress = solanaAddressFromCdp || solanaAddressFromSession;
  const [openAgent, setOpenAgent] = useState(false);
  const [openRun, setOpenRun] = useState(false);
  const [openAddFunds, setOpenAddFunds] = useState(false);

  // Use PHANTOM cash mint if provided (NEXT_PUBLIC_PHANTOM_CASH_MINT)
  const PHANTOM_CASH_MINT = process.env.NEXT_PUBLIC_PHANTOM_CASH_MINT || "";
  const { balance } = useGLXBalance(solanaAddress || null, {
    tokenAddress: PHANTOM_CASH_MINT || undefined,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-6">
          <div className="text-sm text-zinc-600">Wallet balance</div>
          <div className="mt-1 text-3xl font-semibold">{balance}</div>
          <p className="mt-2 text-sm text-zinc-600">
            Balance for your connected Phantom Cash SPL token.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setOpenAddFunds(true)}
              className="rounded-lg border px-3 py-1.5 text-sm"
            >
              Add funds
            </button>
          </div>
        </div>
        <div className="rounded-2xl border p-6">
          <div className="text-sm text-zinc-600">Jobs</div>
          <div className="mt-1 text-3xl font-semibold">—</div>
          <p className="mt-2 text-sm text-zinc-600">
            Recent runs will appear here.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <div className="text-sm text-zinc-600">Storage</div>
          <div className="mt-1 text-3xl font-semibold">—</div>
          <p className="mt-2 text-sm text-zinc-600">Arweave/IPFS usage.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => setOpenAgent(true)}
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          Create Agent
        </button>
        <button
          onClick={() => setOpenRun(true)}
          className="rounded-xl border px-4 py-2"
        >
          Run Script
        </button>
      </div>

      <CreateAgentModal
        open={openAgent}
        onClose={() => setOpenAgent(false)}
      />
      <RunScriptModal open={openRun} onClose={() => setOpenRun(false)} />
      {openAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Add funds</h3>
            <p className="mt-2 text-sm text-zinc-600">
              To test on devnet you can request SOL from a faucet or use an on‑ramp.
            </p>

            <div className="mt-4">
              <label className="block text-xs text-zinc-500">Your address</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  aria-label="solana-address"
                  placeholder="Address"
                  readOnly
                  value={solanaAddress ?? ""}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(solanaAddress ?? "");
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <a
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white text-center"
                href={
                  // Generic devnet faucet - user can paste address or follow the site instructions
                  "https://solfaucet.com/"
                }
              >
                Open Devnet Faucet
              </a>

              <a
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-4 py-2 text-sm text-center"
                href="#"
              >
                On‑ramp / Buy crypto (coming)
              </a>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setOpenAddFunds(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

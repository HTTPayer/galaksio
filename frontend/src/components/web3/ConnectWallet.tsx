"use client";
import { useEffect, useState } from "react";
import {
  connectEmbeddedWallet,
  disconnectEmbeddedWallet,
  onEmbeddedAccountChange,
  isEmbeddedWalletAvailable,
  getEmbeddedWalletAddress,
} from "../../lib/embeddedWallet";
import { useRouter } from "next/navigation";

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function connect() {
    if (!isEmbeddedWalletAvailable()) {
      alert("Embedded CDP wallet not found. Please follow the integration instructions for the embedded wallet.");
      return;
    }

    setLoading(true);
    try {
      const pub = await connectEmbeddedWallet();
      // debug: what the embed returned
      console.log("connectEmbeddedWallet returned", pub);

      setAddress(pub ?? null);

      // If we didn't get an address, abort and show feedback
      if (!pub) {
        console.warn("No address returned from embedded wallet; aborting server session creation");
        alert("No wallet address was returned. Please try again.");
        return;
      }

      // Create a server session so middleware and server-side pages recognize the login.
      // The verify endpoint currently accepts a minimal payload and issues a JWT cookie.
      try {
        const resp = await fetch("/api/siwe/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "embedded", signature: "embedded", address: pub }),
        });

        // Try to parse JSON for helpful debug info (dev only)
        let json: unknown = null;
        try {
          // attempt to parse JSON body for debug info
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          json = await resp.json();
        } catch {
          // ignore parse errors
        }

        if (!resp.ok) {
          const fallback = typeof json === "string" ? json : JSON.stringify(json ?? {});
          console.warn("siwe verify failed", resp.status, fallback);
          alert("Sign in failed — server did not create a session. Check console/network for details.");
          return; // DO NOT navigate if server didn't create the session
        }

        // In dev the token is returned in body for debugging; log it if present
        try {
          const parsed = json as Record<string, unknown> | null;
          if (parsed && typeof parsed.token === "string") {
            console.log("SIWE verify returned token (dev):", parsed.token);
          }
        } catch {}

        // After server sets cookie, force a full navigation to ensure middleware runs and reads cookie.
        window.location.assign("/dashboard");
      } catch (err) {
        // log but continue; user still connected locally
        console.warn("Failed to create server session", err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await disconnectEmbeddedWallet();
      // Inform server to clear session cookie
      try {
        await fetch("/api/siwe/logout", { method: "POST", credentials: "include" });
      } catch (e) {
        console.warn("Failed to clear server session", e);
      }
    } catch (e) {
      console.warn(e);
    }
    setAddress(null);
    // Navigate back to home after logout
    try {
      router.push("/");
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // Try to initialize address from an already-connected embedded wallet
    (async () => {
      try {
        const addr = await getEmbeddedWalletAddress();
        setAddress(addr);
      } catch (e) {
        console.warn(e);
      }
    })();

  const off = onEmbeddedAccountChange((pk: string | null) => setAddress(pk));
    return () => off();
  }, []);

  return (
    <div className="flex items-center gap-2">
      {address ? (
        <>
          <span className="hidden text-sm text-zinc-600 md:inline">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          <button
            onClick={logout}
            className="rounded-lg bg-white border px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          disabled={loading}
          onClick={connect}
          className="rounded-lg bg-black px-3 py-1.5 text-sm text-white"
        >
          {loading ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}

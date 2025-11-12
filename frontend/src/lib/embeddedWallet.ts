/* eslint-disable @typescript-eslint/no-explicit-any */
// Neutral adapter for an embedded CDP wallet.
// Purpose: provide a tiny, stable API that the UI can call while we
// wire the real CDP SDK. Implementations should be replaced with the
// actual SDK calls once you provide the CDP embed script or package.

type AccountChangeHandler = (pubkey: string | null) => void;

declare global {
  interface Window {
    // Common possible names for embedded wallet globals — the real SDK may use something else.
    cdpWallet?: any;
    embeddedWallet?: any;
    CDP?: any;
  }
}

export function isEmbeddedWalletAvailable(): boolean {
  return Boolean(window.cdpWallet || window.embeddedWallet || window.CDP);
}

export async function connectEmbeddedWallet(): Promise<string | null> {
  // Replace this body with the CDP SDK connect call.
  // Example (pseudo): const resp = await window.cdpWallet.connect(); return resp.publicKey.toString();
  const w = window.cdpWallet || window.embeddedWallet || window.CDP;
  if (!w) return null;

  // Best-effort generic flows — these will probably need to be tailored.
  if (typeof w.connect === "function") {
    const resp = await w.connect();
    // try several shapes
    if (resp?.publicKey?.toString) return resp.publicKey.toString();
    if (resp?.publicKey) return String(resp.publicKey);
    if (resp?.address) return String(resp.address);
    return String(resp);
  }

  // Some embeds expose request methods
  if (typeof w.request === "function") {
    const resp = await w.request({ method: "connect" });
    if (resp?.publicKey?.toString) return resp.publicKey.toString();
    if (resp?.publicKey) return String(resp.publicKey);
    return String(resp);
  }

  return null;
}

export async function disconnectEmbeddedWallet(): Promise<void> {
  const w = window.cdpWallet || window.embeddedWallet || window.CDP;
  try {
    if (!w) return;
    if (typeof w.disconnect === "function") await w.disconnect();
    else if (typeof w.request === "function") await w.request({ method: "disconnect" });
  } catch (e) {
    // ignore errors — some SDKs don't implement disconnect
    console.warn("embeddedWallet disconnect failed", e);
  }
}

export function onEmbeddedAccountChange(handler: AccountChangeHandler) {
  const w = window.cdpWallet || window.embeddedWallet || window.CDP;
  if (!w) return () => {};

  // Try common event names; SDK may expose different events — replace as needed.
  const add = () => {
    if (typeof w.on === "function") {
      w.on("accountChanged", (pk: any) => handler(pk ? String(pk) : null));
      w.on("accountsChanged", (arr: any) => handler(arr?.[0] ? String(arr[0]) : null));
    } else if (w.onaccountchange) {
      w.onaccountchange = (pk: any) => handler(pk ? String(pk) : null);
    }
  };

  const remove = () => {
    try {
      if (typeof w.removeListener === "function") {
        w.removeListener("accountChanged", handler as any);
        w.removeListener("accountsChanged", handler as any);
      } else if (w.off) {
        w.off("accountChanged", handler as any);
        w.off("accountsChanged", handler as any);
      } else if (w.onaccountchange) {
        w.onaccountchange = null;
      }
    } catch (e) {
      console.warn(e);
    }
  };

  add();
  return remove;
}

export async function getEmbeddedWalletAddress(): Promise<string | null> {
  const w = window.cdpWallet || window.embeddedWallet || window.CDP;
  if (!w) return null;
  if (w.publicKey?.toString) return w.publicKey.toString();
  if (w.publicKey) return String(w.publicKey);
  if (w.address) return String(w.address);
  if (typeof w.getAddress === "function") return String(await w.getAddress());
  return null;
}

// NOTE: To wire the real CDP SDK do the following (examples):
// - If the SDK is an npm package: `npm install @cdp/sdk` and then import and call its connect functions here.
// - If the SDK requires an embed script, include it in `_document.tsx` or `app/layout.tsx` and then use the global (e.g. window.CDP) in this file.
// After you provide the SDK/package name or embed instructions I will update these functions to call the real API.

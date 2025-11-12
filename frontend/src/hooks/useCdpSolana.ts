/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCdpSolanaStandardWallet } from "@coinbase/cdp-solana-standard-wallet";

// Thin wrapper to expose a stable hook name `useCdpSolana` for the app.
export function useCdpSolana() {
  const { ready, wallet } = useCdpSolanaStandardWallet() as { ready: boolean; wallet: any };

  const address: string | null = ready && wallet?.accounts?.length ? wallet.accounts[0].address : null;

  async function signMessage(message: Uint8Array) {
    if (!ready || !wallet) throw new Error("Wallet not ready");
    return wallet.features['solana:signMessage'].signMessage({ account: wallet.accounts[0], message });
  }

  async function signAndSendTransaction(serializedTx: Uint8Array | string) {
    if (!ready || !wallet) throw new Error("Wallet not ready");
    return wallet.features['solana:signAndSendTransaction'].signAndSendTransaction({
      account: wallet.accounts[0],
      transaction: serializedTx,
      chain: 'solana:devnet',
    });
  }

  return {
    ready,
    wallet,
    address,
    signMessage,
    signAndSendTransaction,
  };
}

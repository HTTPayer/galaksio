"use client";
import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

// Solana token mint (SPL token) - prefer an env var, fallback empty
const SOLANA_GLX = process.env.NEXT_PUBLIC_GLX_TOKEN_SOLANA || "";
// Default to the provided devnet RPC (can be overridden by NEXT_PUBLIC_SOLANA_RPC_URL)
const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://devnet.helius-rpc.com/?api-key=f4ac7f35-7200-468b-a19a-8905bca6437e";

export function useGLXBalance(address?: string | null, options?: { tokenAddress?: string }) {
  const [decimals, setDecimals] = useState<number>(9);
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (!address) return;

    (async () => {
      try {
        const mint = options?.tokenAddress || SOLANA_GLX;
        if (!mint) {
          console.warn("No Solana token mint provided. Returning zero balance.");
          setDecimals(9);
          setBalance("0");
          return;
        }

        const connection = new Connection(SOLANA_RPC_URL);
        const owner = new PublicKey(address);
        const tokenMint = new PublicKey(mint);

        const accounts = await connection.getTokenAccountsByOwner(owner, { mint: tokenMint });

        if (!accounts || accounts.value.length === 0) {
          setDecimals(9);
          setBalance("0");
          return;
        }

        const accountPubkey = accounts.value[0].pubkey;
        const tokenBalance = await connection.getTokenAccountBalance(accountPubkey);

        setDecimals(tokenBalance.value.decimals);
        setBalance(tokenBalance.value.uiAmountString ?? String(Number(tokenBalance.value.amount) / Math.pow(10, tokenBalance.value.decimals)));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [address, options?.tokenAddress]);

  return { balance, decimals };
}

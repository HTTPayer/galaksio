/**
 * GLUSD Contract Configuration
 * Network: Avalanche C-Chain (43114)
 */

import { Address } from 'viem'

// Contract Addresses
export const CHAIN_ID = 43114 // Avalanche C-Chain

export const USDC_ADDRESS: Address = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address || '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
export const GLUSD_ADDRESS: Address = process.env.NEXT_PUBLIC_GLUSD_ADDRESS as Address || '0xbE5577295bbfe5261f7FD0E2dc6B29c7F14405f7'

// Token Decimals
export const USDC_DECIMALS = 6
export const GLUSD_DECIMALS = 6

// Fee Configuration
export const MINT_FEE = 0.005 // 0.5%
export const REDEEM_FEE = 0.005 // 0.5%

/**
 * Calculate GLUSD output after mint
 * Formula: GLUSD minted = (USDC amount × (1 – 0.005)) / exchange rate
 */
export function calculateMintOutput(usdcAmount: number, exchangeRate: number): number {
  return (usdcAmount * (1 - MINT_FEE)) / exchangeRate
}

/**
 * Calculate USDC output after redeem
 * Formula: USDC out = (GLUSD amount × (1 – 0.005)) × exchange rate
 */
export function calculateRedeemOutput(glusdAmount: number, exchangeRate: number): number {
  return glusdAmount * exchangeRate * (1 - REDEEM_FEE)
}

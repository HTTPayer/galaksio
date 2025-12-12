/**
 * GLUSD Custom Hooks
 * Wagmi hooks for interacting with GLUSD and USDC contracts
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits, formatUnits } from 'viem'
import { USDC_ADDRESS, GLUSD_ADDRESS, USDC_DECIMALS, GLUSD_DECIMALS } from './glusd-config'
import ERC20_ABI from '@/abi/ERC20.json'
import GLUSD_ABI from '@/abi/GLUSD.json'

// ============================================================================
// Read Hooks - GLUSD Contract
// ============================================================================

export function useGLUSDExchangeRate() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'exchangeRate',
  })
}

export function useGLUSDCurrentAPRs() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'getCurrentAPRs',
  })
}

export function useGLUSDVaultStatus() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'vaultStatus',
  })
}

export function useGLUSDTotalSupply() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'totalSupply',
  })
}

export function useGLUSDMaxTotalSupply() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'MAX_TOTAL_SUPPLY',
  })
}

export function useGLUSDRemainingMintableSupply() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'remainingMintableSupply',
  })
}

export function useGLUSDLastSnapshotTime() {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'lastSnapshotTime',
  })
}

// ============================================================================
// Read Hooks - User Balances
// ============================================================================

export function useGLUSDBalance(userAddress?: Address) {
  return useReadContract({
    address: GLUSD_ADDRESS,
    abi: GLUSD_ABI.abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

export function useUSDCBalance(userAddress?: Address) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI.abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

export function useUSDCAllowance(userAddress?: Address) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI.abi,
    functionName: 'allowance',
    args: userAddress ? [userAddress, GLUSD_ADDRESS] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// ============================================================================
// Write Hooks - Approve USDC
// ============================================================================

export function useApproveUSDC() {
  const {
    data: hash,
    writeContract: approve,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash })

  const approveUSDC = async (amount: string) => {
    const usdcAmount = parseUnits(amount, USDC_DECIMALS)

    await approve({
      address: USDC_ADDRESS,
      abi: ERC20_ABI.abi,
      functionName: 'approve',
      args: [GLUSD_ADDRESS, usdcAmount],
    })
  }

  return {
    approveUSDC,
    hash,
    isApproving,
    isConfirming,
    isConfirmed,
    approveError,
    confirmError,
  }
}

// ============================================================================
// Write Hooks - Mint GLUSD
// ============================================================================

export function useMintGLUSD() {
  const {
    data: hash,
    writeContract: mint,
    isPending: isMinting,
    error: mintError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash })

  /**
   * Mint GLUSD using USDC.
   * @param usdcAmountString - number-like string, e.g. "100"
   */
  const mintGLUSD = async (usdcAmountString: string) => {
    const usdcAmount = parseUnits(usdcAmountString, USDC_DECIMALS)

    await mint({
      address: GLUSD_ADDRESS,
      abi: GLUSD_ABI.abi,
      functionName: 'mint',
      args: [usdcAmount],
    })
  }

  return {
    mintGLUSD,
    hash,
    isMinting,
    isConfirming,
    isConfirmed,
    mintError,
    confirmError,
  }
}

// ============================================================================
// Write Hooks - Redeem GLUSD
// ============================================================================

export function useRedeemGLUSD() {
  const {
    data: hash,
    writeContract: redeem,
    isPending: isRedeeming,
    error: redeemError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash })

  /**
   * Redeem GLUSD for underlying USDC.
   * @param glusdAmountString - number-like string, e.g. "100"
   */
  const redeemGLUSD = async (glusdAmountString: string) => {
    const glusdAmount = parseUnits(glusdAmountString, GLUSD_DECIMALS)

    await redeem({
      address: GLUSD_ADDRESS,
      abi: GLUSD_ABI.abi,
      functionName: 'redeem',
      args: [glusdAmount],
    })
  }

  return {
    redeemGLUSD,
    hash,
    isRedeeming,
    isConfirming,
    isConfirmed,
    redeemError,
    confirmError,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatGLUSD(value: bigint | undefined): string {
  if (!value) return '0'
  return formatUnits(value, GLUSD_DECIMALS)
}

export function formatUSDC(value: bigint | undefined): string {
  if (!value) return '0'
  return formatUnits(value, USDC_DECIMALS)
}

export function formatExchangeRate(value: bigint | undefined): string {
  if (!value) return '0'
  return formatUnits(value, GLUSD_DECIMALS)
}

export function formatAPR(value: bigint | undefined): string {
  if (!value) return '0'
  return (Number(value) / 1e6).toFixed(2)
}

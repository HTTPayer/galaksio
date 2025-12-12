/**
 * GLUSD Mint Card Component
 * UI for minting GLUSD with USDC
 */

'use client'

import { useState, useEffect, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  useUSDCBalance,
  useUSDCAllowance,
  useGLUSDExchangeRate,
  useApproveUSDC,
  useMintGLUSD,
  formatUSDC,
  formatExchangeRate,
} from '@/lib/contracts/useGLUSD'
import { calculateMintOutput } from '@/lib/contracts/glusd-config'
import { Address, parseUnits } from 'viem'
import { toast } from 'sonner'
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface GLUSDMintCardProps {
  userAddress?: Address
}

export function GLUSDMintCard({ userAddress }: GLUSDMintCardProps) {
  const [usdcAmount, setUsdcAmount] = useState('')
  const [glusdPreview, setGlusdPreview] = useState('0')

  // Read data
  const { data: usdcBalance, refetch: refetchUSDCBalance } = useUSDCBalance(userAddress)
  const { data: usdcAllowance, refetch: refetchAllowance } = useUSDCAllowance(userAddress)
  const { data: exchangeRate } = useGLUSDExchangeRate()

  // Write actions
  const {
    approveUSDC,
    isApproving,
    isConfirming: isApprovingConfirming,
    isConfirmed: isApproved,
    approveError,
  } = useApproveUSDC()

  const {
    mintGLUSD,
    isMinting,
    isConfirming: isMintingConfirming,
    isConfirmed: isMinted,
    mintError,
  } = useMintGLUSD()

  // Calculate preview whenever amount or exchange rate changes
  useEffect(() => {
    if (usdcAmount && exchangeRate) {
      const amount = parseFloat(usdcAmount)
      const rate = parseFloat(formatExchangeRate(exchangeRate as bigint))
      if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
        const output = calculateMintOutput(amount, rate)
        setGlusdPreview(output.toFixed(6))
      } else {
        setGlusdPreview('0')
      }
    } else {
      setGlusdPreview('0')
    }
  }, [usdcAmount, exchangeRate])

  // Handle approval success
  useEffect(() => {
    if (isApproved) {
      toast.success('USDC approved successfully!')
      refetchAllowance()
    }
  }, [isApproved, refetchAllowance])

  // Handle mint success
  useEffect(() => {
    if (isMinted) {
      toast.success('GLUSD minted successfully!')
      setUsdcAmount('')
      setGlusdPreview('0')
      refetchUSDCBalance()
      refetchAllowance()
    }
  }, [isMinted, refetchUSDCBalance, refetchAllowance])

  // Handle errors
  useEffect(() => {
    if (approveError) {
      toast.error(`Approval failed: ${approveError.message}`)
    }
  }, [approveError])

  useEffect(() => {
    if (mintError) {
      toast.error(`Mint failed: ${mintError.message}`)
    }
  }, [mintError])

  const handleApprove = async () => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
      toast.error('Please enter a valid USDC amount')
      return
    }
    try {
      await approveUSDC(usdcAmount)
    } catch (error) {
      console.error('Approve error:', error)
    }
  }

  const handleMint = async () => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
      toast.error('Please enter a valid USDC amount')
      return
    }
    try {
      await mintGLUSD(usdcAmount)
    } catch (error) {
      console.error('Mint error:', error)
    }
  }

  const handleMaxClick = () => {
    if (usdcBalance) {
      setUsdcAmount(formatUSDC(usdcBalance as bigint))
    }
  }

  const needsApproval = () => {
    if (!usdcAmount || !usdcAllowance) return true
    try {
      const amount = parseUnits(usdcAmount, 6)
      return amount > (usdcAllowance as bigint)
    } catch {
      return true
    }
  }

  const isLoading = isApproving || isApprovingConfirming || isMinting || isMintingConfirming

  const previewSection: React.ReactElement = (
    <div key="preview" className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">You will receive</span>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{glusdPreview} GLUSD</div>
          <div className="text-xs text-slate-500">After 0.5% fee</div>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-white">Mint GLUSD</CardTitle>
        <CardDescription className="text-slate-400">
          Exchange USDC for yield-bearing GLUSD tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Fragment>
        {/* USDC Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="usdc-amount" className="text-slate-300">
              USDC Amount
            </Label>
            {userAddress && (
              <span className="text-xs text-slate-400">
                Balance: {formatUSDC(usdcBalance as bigint)} USDC
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              id="usdc-amount"
              type="number"
              step="0.000001"
              placeholder="0.00"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white pr-16"
              disabled={isLoading || !userAddress}
            />
            {userAddress && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-blue-400 hover:text-blue-300"
                onClick={handleMaxClick}
                disabled={isLoading}
              >
                MAX
              </Button>
            )}
          </div>
        </div>

        {previewSection as any}

        {/* Exchange Rate Info */}
        {exchangeRate && (
          <div className="text-xs text-slate-400 text-center">
            Exchange Rate: 1 GLUSD = {formatExchangeRate(exchangeRate as bigint)} USDC
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!userAddress ? (
            <Button disabled className="w-full">
              Connect Wallet to Mint
            </Button>
          ) : needsApproval() ? (
            <Button
              onClick={handleApprove}
              disabled={isLoading || !usdcAmount || parseFloat(usdcAmount) <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isApproving || isApprovingConfirming ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  {isApproving ? 'Approving...' : 'Confirming...'}
                </>
              ) : isApproved ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Approved
                </>
              ) : (
                'Approve USDC'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleMint}
              disabled={isLoading || !usdcAmount || parseFloat(usdcAmount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isMinting || isMintingConfirming ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  {isMinting ? 'Minting...' : 'Confirming...'}
                </>
              ) : (
                'Mint GLUSD'
              )}
            </Button>
          )}
        </div>
        </Fragment>
      </CardContent>
    </Card>
  )
}

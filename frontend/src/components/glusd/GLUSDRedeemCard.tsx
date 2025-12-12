/**
 * GLUSD Redeem Card Component
 * UI for redeeming GLUSD for USDC
 */

'use client'

import { useState, useEffect, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  useGLUSDBalance,
  useGLUSDExchangeRate,
  useRedeemGLUSD,
  formatGLUSD,
  formatExchangeRate,
} from '@/lib/contracts/useGLUSD'
import { calculateRedeemOutput } from '@/lib/contracts/glusd-config'
import { Address } from 'viem'
import { toast } from 'sonner'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface GLUSDRedeemCardProps {
  userAddress?: Address
}

export function GLUSDRedeemCard({ userAddress }: GLUSDRedeemCardProps) {
  const [glusdAmount, setGlusdAmount] = useState('')
  const [usdcPreview, setUsdcPreview] = useState('0')

  // Read data
  const { data: glusdBalance, refetch: refetchGLUSDBalance } = useGLUSDBalance(userAddress)
  const { data: exchangeRate } = useGLUSDExchangeRate()

  // Write actions
  const {
    redeemGLUSD,
    isRedeeming,
    isConfirming: isRedeemingConfirming,
    isConfirmed: isRedeemed,
    redeemError,
  } = useRedeemGLUSD()

  // Calculate preview whenever amount or exchange rate changes
  useEffect(() => {
    if (glusdAmount && exchangeRate) {
      const amount = parseFloat(glusdAmount)
      const rate = parseFloat(formatExchangeRate(exchangeRate as bigint))
      if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
        const output = calculateRedeemOutput(amount, rate)
        setUsdcPreview(output.toFixed(6))
      } else {
        setUsdcPreview('0')
      }
    } else {
      setUsdcPreview('0')
    }
  }, [glusdAmount, exchangeRate])

  // Handle redeem success
  useEffect(() => {
    if (isRedeemed) {
      toast.success('GLUSD redeemed successfully!')
      setGlusdAmount('')
      setUsdcPreview('0')
      refetchGLUSDBalance()
    }
  }, [isRedeemed, refetchGLUSDBalance])

  // Handle errors
  useEffect(() => {
    if (redeemError) {
      toast.error(`Redeem failed: ${redeemError.message}`)
    }
  }, [redeemError])

  const handleRedeem = async () => {
    if (!glusdAmount || parseFloat(glusdAmount) <= 0) {
      toast.error('Please enter a valid GLUSD amount')
      return
    }
    try {
      await redeemGLUSD(glusdAmount)
    } catch (error) {
      console.error('Redeem error:', error)
    }
  }

  const handleMaxClick = () => {
    if (glusdBalance) {
      setGlusdAmount(formatGLUSD(glusdBalance as bigint))
    }
  }

  const isLoading = isRedeeming || isRedeemingConfirming

  const previewSection: React.ReactElement = (
    <div key="preview" className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">You will receive</span>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{usdcPreview} USDC</div>
          <div className="text-xs text-slate-500">After 0.5% fee</div>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-white">Redeem GLUSD</CardTitle>
        <CardDescription className="text-slate-400">
          Exchange GLUSD for USDC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Fragment>
        {/* GLUSD Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="glusd-amount" className="text-slate-300">
              GLUSD Amount
            </Label>
            {userAddress && (
              <span className="text-xs text-slate-400">
                Balance: {formatGLUSD(glusdBalance as bigint)} GLUSD
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              id="glusd-amount"
              type="number"
              step="0.000001"
              placeholder="0.00"
              value={glusdAmount}
              onChange={(e) => setGlusdAmount(e.target.value)}
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

        {/* Action Button */}
        <div className="space-y-2">
          {!userAddress ? (
            <Button disabled className="w-full">
              Connect Wallet to Redeem
            </Button>
          ) : (
            <Button
              onClick={handleRedeem}
              disabled={isLoading || !glusdAmount || parseFloat(glusdAmount) <= 0}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  {isRedeeming ? 'Redeeming...' : 'Confirming...'}
                </>
              ) : (
                'Redeem GLUSD'
              )}
            </Button>
          )}
        </div>
        </Fragment>
      </CardContent>
    </Card>
  )
}

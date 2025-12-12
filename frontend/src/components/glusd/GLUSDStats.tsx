/**
 * GLUSD Stats Component
 * Displays real-time vault statistics
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useGLUSDExchangeRate,
  useGLUSDCurrentAPRs,
  useGLUSDVaultStatus,
  useGLUSDTotalSupply,
  useGLUSDMaxTotalSupply,
  formatUSDC,
  formatGLUSD,
  formatExchangeRate,
  formatAPR,
} from '@/lib/contracts/useGLUSD'
import { ArrowTrendingUpIcon, BanknotesIcon, ChartBarIcon, ScaleIcon } from '@heroicons/react/24/outline'

export function GLUSDStats() {
  const { data: exchangeRate, isLoading: loadingExchangeRate } = useGLUSDExchangeRate()
  const { data: aprs, isLoading: loadingAPRs } = useGLUSDCurrentAPRs()
  const { data: vaultStatus, isLoading: loadingVaultStatus } = useGLUSDVaultStatus()
  const { data: totalSupply } = useGLUSDTotalSupply()
  const { data: maxTotalSupply } = useGLUSDMaxTotalSupply()

  // Parse APRs tuple
  const apr7d = aprs && Array.isArray(aprs) ? aprs[0] : undefined
  const apr30d = aprs && Array.isArray(aprs) ? aprs[1] : undefined

  // Parse vault status tuple
  const vaultUsdcBalance = vaultStatus && Array.isArray(vaultStatus) ? vaultStatus[0] : undefined
  const glusdSupply = vaultStatus && Array.isArray(vaultStatus) ? vaultStatus[1] : undefined

  // Calculate percent minted
  const percentMinted =
    totalSupply && maxTotalSupply
      ? ((Number(totalSupply) / Number(maxTotalSupply)) * 100).toFixed(2)
      : '0'

  const stats = [
    {
      name: 'Exchange Rate',
      value: loadingExchangeRate ? '...' : `${formatExchangeRate(exchangeRate as bigint)} USDC`,
      description: 'USDC per GLUSD',
      icon: ScaleIcon,
    },
    {
      name: '7-Day APR',
      value: loadingAPRs ? '...' : `${formatAPR(apr7d)}%`,
      description: 'Current 7-day yield',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: '30-Day APR',
      value: loadingAPRs ? '...' : `${formatAPR(apr30d)}%`,
      description: 'Current 30-day yield',
      icon: ChartBarIcon,
    },
    {
      name: 'Vault USDC Balance',
      value: loadingVaultStatus ? '...' : `${Number(formatUSDC(vaultUsdcBalance)).toLocaleString()} USDC`,
      description: 'Total USDC in vault',
      icon: BanknotesIcon,
    },
    {
      name: 'Total Supply',
      value: `${Number(formatGLUSD(totalSupply as bigint)).toLocaleString()} GLUSD`,
      description: `${percentMinted}% of max supply`,
      icon: BanknotesIcon,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.name} className="border-slate-700 bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{stat.name}</CardTitle>
              <Icon className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

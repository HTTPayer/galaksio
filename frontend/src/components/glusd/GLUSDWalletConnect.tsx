/**
 * Wallet Connect Component for GLUSD Page
 * Standalone wallet connection component
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { ArrowRightOnRectangleIcon, WalletIcon } from '@heroicons/react/24/outline'

export function GLUSDWalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get MetaMask connector
  const metaMaskConnector = connectors.find((connector) => connector.id === 'injected')

  // Show loading state during hydration
  if (!mounted) {
    return (
      <Button disabled className="bg-blue-600">
        <WalletIcon className="h-5 w-5 mr-2" />
        Connect MetaMask
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
          <WalletIcon className="h-5 w-5 text-green-400" />
          <span className="text-sm font-medium text-white">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => metaMaskConnector && connect({ connector: metaMaskConnector })}
      className="bg-blue-600 hover:bg-blue-700"
    >
      <WalletIcon className="h-5 w-5 mr-2" />
      Connect MetaMask
    </Button>
  )
}

/**
 * Web3 Provider Configuration
 * Configures wagmi for Avalanche C-Chain with MetaMask
 */

'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { avalanche } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from '@wagmi/connectors'
import { ReactNode } from 'react'

// Configure chains and transports
const config = createConfig({
  chains: [avalanche],
  connectors: [
    injected({ target: 'metaMask' }),
  ],
  transports: {
    [avalanche.id]: http(),
  },
})

// Create a client
const queryClient = new QueryClient()

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export { config }

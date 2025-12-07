'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connectedAddress?: string;
}

export default function WalletConnect({ onConnect, onDisconnect, connectedAddress }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Check if window.ethereum exists (MetaMask or similar wallet for USDC payments)
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[];
        
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet to make USDC payments');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (connectedAddress) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2">
        <Wallet className="h-4 w-4 text-green-400" />
        <span className="text-sm text-slate-300">
          {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
        </span>
        <button
          onClick={onDisconnect}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet for USDC Payments'}
    </button>
  );
}

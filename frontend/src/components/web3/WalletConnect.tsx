'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Wallet } from 'lucide-react';

export default function WalletConnect() {
  const { walletAddress, connectWallet, disconnectWallet, isConnecting } = useWallet();

  if (walletAddress) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2">
        <Wallet className="h-4 w-4 text-green-600" />
        <span className="text-sm text-zinc-700">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
        <button
          onClick={disconnectWallet}
          className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

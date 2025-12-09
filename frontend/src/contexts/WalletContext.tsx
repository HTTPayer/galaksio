"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface WalletContextType {
  walletAddress: string | undefined;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  // Restore wallet connection on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('galaksio_wallet_address');
    if (savedAddress && typeof window !== 'undefined' && window.ethereum) {
      // Verify the wallet is still connected
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((result) => {
          const accounts = result as string[];
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            setWalletAddress(accounts[0]);
          } else {
            localStorage.removeItem('galaksio_wallet_address');
          }
        })
        .catch(() => {
          localStorage.removeItem('galaksio_wallet_address');
        });
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.on) {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          // User switched accounts
          setWalletAddress(accounts[0]);
          localStorage.setItem('galaksio_wallet_address', accounts[0]);
          toast.success('Wallet switched');
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('Please install MetaMask');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const accounts = result as string[];
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        localStorage.setItem('galaksio_wallet_address', accounts[0]);
        toast.success('Wallet connected!');
      }
    } catch (error) {
      const err = error as Error & { message?: string };
      console.error('Failed to connect wallet:', error);
      toast.error(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(undefined);
    localStorage.removeItem('galaksio_wallet_address');
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        disconnectWallet,
        isConnecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

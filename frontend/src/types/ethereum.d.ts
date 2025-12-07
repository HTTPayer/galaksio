// Ethereum provider type for Web3 wallets (MetaMask, etc.)
// Used for USDC payments via x402 protocol

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface Window {
  ethereum?: EthereumProvider;
}

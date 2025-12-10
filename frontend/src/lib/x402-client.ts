/**
 * x402 Payment Client
 * Simplified version for MetaMask integration with WalletConnect
 */

export interface X402PaymentRequirements {
  x402Version: number;
  accepts: Array<{
    scheme: string;
    network: string;
    payTo: string;
    asset: string;
    maxAmountRequired: string;
    resource?: string;
    description?: string;
    mimeType?: string;
    maxTimeoutSeconds?: number;
    extra?: {
      name?: string;
      version?: string;
      [key: string]: any;
    };
  }>;
}

export interface PaymentInfo {
  network: string;
  spender: string;
  asset: string;
  userAddress: string;
}

/**
 * Helper to get chainId from network name
 */
function getChainIdFromNetwork(network: string): number {
  const chainIds: Record<string, number> = {
    'avalanche': 43114,
    'avalanche-c': 43114,
    'avalanche-c-chain': 43114,
    'avax': 43114,
    'base': 8453,
    'base-mainnet': 8453,
    'base-sepolia': 84532,
    'ethereum': 1,
    'eth-mainnet': 1,
    'polygon': 137,
    'polygon-mainnet': 137,
    'arbitrum': 42161,
    'optimism': 10
  };
  return chainIds[network.toLowerCase()] || 43114; // Default Avalanche C-Chain
}

/**
 * Get network configuration for wallet_addEthereumChain
 */
function getNetworkConfig(network: string, chainIdHex: string) {
  const configs: Record<string, any> = {
    'avalanche': {
      chainId: chainIdHex,
      chainName: 'Avalanche C-Chain',
      nativeCurrency: {
        name: 'AVAX',
        symbol: 'AVAX',
        decimals: 18
      },
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
      blockExplorerUrls: ['https://snowtrace.io/']
    },
    'base': {
      chainId: chainIdHex,
      chainName: 'Base',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org/']
    },
    'ethereum': {
      chainId: chainIdHex,
      chainName: 'Ethereum Mainnet',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://eth.llamarpc.com'],
      blockExplorerUrls: ['https://etherscan.io/']
    },
    'polygon': {
      chainId: chainIdHex,
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com/']
    }
  };
  
  return configs[network.toLowerCase()] || configs['avalanche'];
}

/**
 * Sign payment with MetaMask using EIP-3009 TransferWithAuthorization
 * Uses the already connected wallet from WalletConnect component
 */
async function signWithMetaMask(
  paymentOption: X402PaymentRequirements['accepts'][0],
  userAddress: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found. Please connect your wallet first.');
  }

  const ethereum = window.ethereum;

  try {
    // Get chainId from payment option network
    const targetChainId = getChainIdFromNetwork(paymentOption.network);
    const targetChainIdHex = '0x' + targetChainId.toString(16);

    // Check current network
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    
    // Switch to required network if not already on it
    if (currentChainId !== targetChainIdHex) {
      console.log(`[X402] Current network: ${currentChainId}, switching to ${paymentOption.network} (${targetChainIdHex})...`);
      
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
      } catch (switchError: unknown) {
        // If chain not added (error 4902), add it
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          console.log(`[X402] Adding ${paymentOption.network} to wallet...`);
          // Get network config
          const networkConfig = getNetworkConfig(paymentOption.network, targetChainIdHex);
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } else {
          throw switchError;
        }
      }
    }

    // 1. Generate random nonce (32 bytes)
    const nonceBytes = new Uint8Array(32);
    crypto.getRandomValues(nonceBytes);
    const nonce = '0x' + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Timestamps - usar validAfter = 0 como en el ejemplo oficial
    const now = Math.floor(Date.now() / 1000);
    const validAfter = 0;
    const validBefore = now + 3600; // 1 hour

    // 3. Build EIP-712 message for TransferWithAuthorization
    // Use token info from extra field if available
    const tokenName = paymentOption.extra?.name || 'USD Coin';
    const tokenVersion = paymentOption.extra?.version || '2';
    
    console.log('[X402] Token info:', { name: tokenName, version: tokenVersion, chainId: targetChainId });
    console.log('[X402] Contract address:', paymentOption.asset);
    console.log('[X402] Timestamps:', { validAfter, validBefore });
    
    const domain = {
      name: tokenName,
      version: tokenVersion,
      chainId: targetChainId,
      verifyingContract: paymentOption.asset
    };

    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    // CRÍTICO: value debe ser NUMBER para la firma
    const message = {
      from: userAddress,
      to: paymentOption.payTo,
      value: parseInt(paymentOption.maxAmountRequired), // NUMBER for signing
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce
    };

    // 4. Sign with eth_signTypedData_v4
    const signature = await ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [
        userAddress,
        JSON.stringify({
          types,
          domain,
          primaryType: 'TransferWithAuthorization',
          message
        })
      ]
    });

    // 5. Build x402 payment header
    // Authorization usa STRINGS para enviar al backend
    const paymentData = {
      x402Version: 1,
      scheme: paymentOption.scheme,
      network: paymentOption.network,
      payload: {
        signature: signature,
        authorization: {
          from: userAddress,
          to: paymentOption.payTo,
          value: paymentOption.maxAmountRequired, // STRING for backend
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce: nonce
        }
      }
    };

    const paymentHeader = Buffer.from(JSON.stringify(paymentData)).toString('base64');
    return paymentHeader;

  } catch (error) {
    const err = error as Error & { message?: string };
    throw new Error(`MetaMask payment failed: ${err.message}`);
  }
}

/**
 * Create x402 payment header from connected wallet
 * 
 * @param requirements - Payment requirements from 402 response
 * @param walletAddress - Connected wallet address from WalletConnect
 * @returns Payment header and info
 */
export async function createX402Payment(
  requirements: X402PaymentRequirements,
  walletAddress: string
): Promise<{ paymentHeader: string; paymentInfo: PaymentInfo }> {
  
  // Validate requirements
  if (!requirements.accepts || !Array.isArray(requirements.accepts) || requirements.accepts.length === 0) {
    throw new Error("Invalid x402 payment requirements: missing 'accepts' array");
  }

  // Take first payment option
  const paymentOption = requirements.accepts[0];

  // Sign with MetaMask
  const paymentHeader = await signWithMetaMask(paymentOption, walletAddress);

  // Decode header to extract payment info
  const decodedHeader = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
  const paymentInfo: PaymentInfo = {
    network: decodedHeader.network,
    spender: decodedHeader.payload.authorization.to,
    asset: paymentOption.asset,
    userAddress: decodedHeader.payload.authorization.from
  };

  return { paymentHeader, paymentInfo };
}

/**
 * Calculate HTTPayer relay fee
 * Formula: max(3% × target_amount, $0.002)
 */
export function calculateRelayFee(targetAmountUSD: number): number {
  const threePercent = targetAmountUSD * 0.03;
  const minFee = 0.002;
  return Math.max(threePercent, minFee);
}

/**
 * Calculate total amount to pay (target + relay fee)
 */
export function calculateTotalAmount(targetAmountUSD: number): number {
  return targetAmountUSD + calculateRelayFee(targetAmountUSD);
}

/**
 * Revoke approval for a spender (set allowance to 0)
 */
export async function revokeApproval(paymentInfo: PaymentInfo): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const ethereum = window.ethereum;

  try {
    const result = await ethereum.request({ method: 'eth_requestAccounts' });
    const accounts = result as string[];
    const userAddress = accounts[0];

    // approve(address spender, uint256 amount) with amount = 0
    const approveSignature = '0x095ea7b3';
    const paddedSpender = paymentInfo.spender.replace('0x', '').padStart(64, '0');
    const paddedAmount = '0'.padStart(64, '0'); // 0 to revoke
    const data = approveSignature + paddedSpender + paddedAmount;

    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: userAddress,
        to: paymentInfo.asset,
        data: data,
        value: '0x0'
      }]
    });

    // Wait for confirmation
    let receipt: { status?: string } | null = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!receipt && attempts < maxAttempts) {
      try {
        receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        }) as { status?: string } | null;

        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      } catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    if (!receipt || receipt.status === '0x0') {
      throw new Error('Revocation transaction failed');
    }
  } catch (error) {
    const err = error as Error & { message?: string };
    throw new Error(`Failed to revoke approval: ${err.message}`);
  }
}

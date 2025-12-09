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
    // Force Avalanche C-Chain (43114)
    const targetChainId = 43114;
    const targetChainIdHex = '0x' + targetChainId.toString(16);

    // Check current network
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    
    // Switch to Avalanche C-Chain if not already on it
    if (currentChainId !== targetChainIdHex) {
      console.log(`[X402] Current network: ${currentChainId}, switching to Avalanche C-Chain (${targetChainIdHex})...`);
      
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
      } catch (switchError: unknown) {
        // If chain not added (error 4902), add it
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          console.log('[X402] Adding Avalanche C-Chain to wallet...');
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainIdHex,
              chainName: 'Avalanche C-Chain',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18
              },
              rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://snowtrace.io/']
            }],
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

    // 2. Timestamps
    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + 900; // Valid for 15 minutes

    // 3. Build EIP-712 message for TransferWithAuthorization
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: targetChainId, // Use Avalanche C-Chain
      verifyingContract: paymentOption.asset
    };

    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    const message = {
      from: userAddress,
      to: paymentOption.payTo,
      value: paymentOption.maxAmountRequired,
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
          domain,
          types,
          primaryType: 'TransferWithAuthorization',
          message
        })
      ]
    });

    // 5. Build x402 payment header (force 'avalanche' network)
    const paymentData = {
      x402Version: 1,
      Scheme: 'exact',
      network: 'avalanche', // Force Avalanche network
      payload: {
        signature: signature,
        authorization: {
          from: userAddress,
          to: paymentOption.payTo,
          value: String(paymentOption.maxAmountRequired),
          validAfter: String(validAfter),
          validBefore: String(validBefore),
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

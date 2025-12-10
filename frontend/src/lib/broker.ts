/**
 * Galaksio Broker Helper Module
 * 
 * High-level helpers that handle the full X402 payment flow:
 * 1. Call broker endpoint
 * 2. Handle HTTP 402 response
 * 3. Execute on-chain payment
 * 4. Retry request with payment proof
 * 5. Return final successful response
 * 
 * Frontend should ONLY call these helpers, never implement X402 logic directly.
 * 
 * IMPORTANT: This module follows the REDUCED BROKER API SPEC (Parte 3)
 * - Uses correct endpoint paths: /store, /run, /cache (not /api/*)
 * - Returns only safe fields specified in the spec
 * - Never exposes 402 responses to UI
 * - Never queries broker directly for job status (only backend refresh does this)
 */

import { createX402Payment, type X402PaymentRequirements } from './x402-client';

const BROKER_API_BASE = process.env.NEXT_PUBLIC_BROKER_API_URL || 'https://multidimensional-reviewless-freda.ngrok-free.dev';

/**
 * Generic broker request with X402 payment handling
 */
async function brokerRequestWithPayment<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BROKER_API_BASE}${endpoint}`;
  
  console.log(`[Broker] Calling ${endpoint}...`);
  
  // First attempt - may return 402
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  console.log(`[Broker] Response status: ${response.status}`);

  // Handle 402 Payment Required
  if (response.status === 402) {
    console.log('[Broker] Payment required, processing X402...');
    
    let paymentRequirements: X402PaymentRequirements;
    try {
      const responseText = await response.text();
      paymentRequirements = JSON.parse(responseText) as X402PaymentRequirements;
      console.log('[Broker] Payment requirements:', paymentRequirements);
    } catch (err) {
      console.error('[Broker] Failed to parse 402 response:', err);
      throw new Error('Invalid payment requirements from broker');
    }
    
    // Check if wallet is available
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Payment required but wallet not connected. Please connect your wallet.');
    }

    // Get connected wallet address
    const ethereum = window.ethereum;
    const result = await ethereum.request({ method: 'eth_accounts' });
    const accounts = result as string[];
    if (!accounts || accounts.length === 0) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    const userAddress = accounts[0];
    console.log('[Broker] User address:', userAddress);

    // Create payment authorization
    console.log('[Broker] Creating payment authorization...');
    const paymentResult = await createX402Payment(paymentRequirements, userAddress);
    console.log('[Broker] Payment header (base64):', paymentResult.paymentHeader);
    
    // Debug: decode and log payment data
    try {
      const decoded = JSON.parse(Buffer.from(paymentResult.paymentHeader, 'base64').toString());
      console.log('[Broker] Decoded payment data:', decoded);
    } catch (e) {
      console.error('[Broker] Failed to decode payment header:', e);
    }
    
    console.log('[Broker] Payment created, retrying request...');

    // Retry request with payment header
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'X-Payment': paymentResult.paymentHeader,
      },
    });
    
    console.log(`[Broker] Retry response status: ${response.status}`);
  }

  // Check final response
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Broker] Error response:`, errorText);
    throw new Error(`Broker request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Run compute job on Galaksio Broker
 * 
 * Endpoint: POST /run
 * 
 * @param params - Compute job parameters
 * @returns Broker response with jobId, status, result (stdout, stderr, exitCode, executionTime)
 * 
 * Safe fields for UI (per actual API docs):
 * - jobId, status
 * - result.stdout, result.stderr, result.exitCode, result.executionTime
 * 
 * @example
 * const result = await broker.run({
 *   code: 'print("Hello World")',
 *   language: 'python',
 *   gpu_type: 'l40s',
 *   gpu_count: 1,
 *   timeout: 300,
 *   on_demand: false
 * });
 * // Returns: { jobId, status, result: { stdout, stderr, exitCode, executionTime } }
 */
export async function run(params: {
  code: string;
  language: string;
  gpu_type?: string;
  gpu_count?: number;
  timeout?: number;
  on_demand?: boolean;
}): Promise<{
  jobId: string;
  status: string;
  result: {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
  };
}> {
  return brokerRequestWithPayment('/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Store file on decentralized storage via Galaksio Broker
 * 
 * Endpoint: POST /store
 * 
 * @param params - Storage parameters
 * @returns Broker response with jobId, status, result (cid, url, provider, size)
 * 
 * Safe fields for UI (per reduced spec):
 * - jobId, status
 * - result.cid, result.url, result.provider, result.size
 * 
 * @example
 * const result = await broker.store({
 *   data: fileContent,
 *   filename: 'myfile.txt',
 *   options: {
 *     permanent: false,
 *     ttl: 86400,
 *     provider: 'ipfs'
 *   }
 * });
 */
export async function store(params: {
  data: string | File;
  filename?: string;
  options?: {
    permanent?: boolean;
    ttl?: number;
    provider?: string;
  };
}): Promise<{
  jobId: string;
  status: string;
  result: {
    cid: string;
    url: string;
    provider: string;
    size: number;
  };
}> {
  // Convert File to base64 if needed
  let base64Data: string;
  let finalFilename: string;

  if (params.data instanceof File) {
    // Read file as base64
    const arrayBuffer = await params.data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
    finalFilename = params.filename || params.data.name;
  } else {
    // If data is already a string, assume it's base64 or convert it
    if (params.data.match(/^[A-Za-z0-9+/=]+$/)) {
      // Already base64
      base64Data = params.data;
    } else {
      // Plain text, convert to base64
      base64Data = btoa(params.data);
    }
    finalFilename = params.filename || 'data.txt';
  }

  // Build request body according to API spec
  const body: {
    data: string;
    filename: string;
    options?: {
      permanent?: boolean;
      ttl?: number;
      provider?: string;
    };
  } = {
    data: base64Data,
    filename: finalFilename,
  };

  if (params.options) {
    body.options = params.options;
  }

  return brokerRequestWithPayment('/store', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Create distributed cache instance via Galaksio Broker
 * 
 * Endpoint: POST /cache
 * 
 * @param params - Cache parameters
 * @returns Broker response with jobId, status, result
 * 
 * Safe fields for UI (per reduced spec):
 * - jobId
 * - result.cacheId, result.endpoint, result.region, result.provider
 * 
 * @example
 * const result = await broker.cache({
 *   data: 'temporary data',
 *   ttl: 3600
 * });
 */
export async function cache(params: {
  data: string | File;
  ttl?: number;
  contentType?: string;
}): Promise<{
  jobId: string;
  status: string;
  result: {
    cacheId: string;
    endpoint: string;
    region: string;
    provider: string;
  };
}> {
  if (params.data instanceof File) {
    // For file uploads
    const formData = new FormData();
    formData.append('file', params.data);
    if (params.ttl) {
      formData.append('ttl', params.ttl.toString());
    }
    if (params.contentType) {
      formData.append('contentType', params.contentType);
    }

    const url = `${BROKER_API_BASE}/cache`;
    console.log('[Broker] Uploading file to /cache...');
    
    let response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    console.log(`[Broker] Cache upload response status: ${response.status}`);

    // Handle 402
    if (response.status === 402) {
      console.log('[Broker] Payment required for cache, processing X402...');
      
      let paymentRequirements: X402PaymentRequirements;
      try {
        const responseText = await response.text();
        paymentRequirements = JSON.parse(responseText) as X402PaymentRequirements;
        console.log('[Broker] Payment requirements:', paymentRequirements);
      } catch (err) {
        console.error('[Broker] Failed to parse 402 response:', err);
        throw new Error('Invalid payment requirements from broker');
      }
      
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Payment required but wallet not connected. Please connect your wallet.');
      }

      const ethereum = window.ethereum;
      const result = await ethereum.request({ method: 'eth_accounts' });
      const accounts = result as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      const userAddress = accounts[0];
      console.log('[Broker] User address:', userAddress);

      console.log('[Broker] Creating payment authorization...');
      const paymentResult = await createX402Payment(paymentRequirements, userAddress);
      console.log('[Broker] Payment created, retrying cache upload...');

      response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Payment': paymentResult.paymentHeader,
        },
      });
      
      console.log(`[Broker] Retry response status: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Broker] Cache error:`, errorText);
      throw new Error(`Cache request failed (${response.status}): ${errorText}`);
    }

    return response.json();
  } else {
    // For text data
    const body = {
      data: params.data,
      ttl: params.ttl,
      contentType: params.contentType || 'text/plain',
    };

    return brokerRequestWithPayment('/cache', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

/**
 * Export all broker functions as a namespace
 */
export const broker = {
  run,
  store,
  cache,
};

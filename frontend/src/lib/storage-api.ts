/**
 * Galaksio Storage API Client
 * x402-powered permanent storage on Arweave
 */

const STORAGE_API_BASE = process.env.NEXT_PUBLIC_STORAGE_API_URL || 'https://storage.galaksio.cloud';

export interface BalanceResponse {
  address: string;
  balance_ar: string;
  balance_winston: string;
}

export interface TransactionInfo {
  tx_id: string;
  owner: string;
  target: string | null;
  quantity: string;
  reward: string;
  data_size: number;
  tags: Record<string, string>[];
  block_height: number | null;
  block_timestamp: number | null;
}

export interface UploadResponse {
  tx_id: string;
  status: string;
  data_size: number;
  ar_cost: string;
  gateway_url: string;
}

export interface QueryRequest {
  op: 'equals' | 'and' | 'or';
  expressions?: QueryRequest[];
  name?: string;
  value?: string;
}

/**
 * Storage API client with x402 payment headers
 */
export class StorageAPI {
  private baseUrl: string;
  private walletAddress?: string;
  private getX402Headers?: () => Promise<Record<string, string>>;

  constructor(walletAddress?: string, getX402Headers?: () => Promise<Record<string, string>>) {
    this.baseUrl = STORAGE_API_BASE;
    this.walletAddress = walletAddress;
    this.getX402Headers = getX402Headers;
  }

  /**
   * Get API health status (free)
   */
  async health(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('Failed to fetch health');
    return response.json();
  }

  /**
   * Get wallet AR balance (free)
   */
  async getBalance(): Promise<BalanceResponse> {
    const response = await fetch(`${this.baseUrl}/balance`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  }

  /**
   * Get transaction info (free)
   */
  async getTransaction(txId: string): Promise<TransactionInfo> {
    const response = await fetch(`${this.baseUrl}/tx/${txId}`);
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return response.json();
  }

  /**
   * Upload data to Arweave
   * Cost: $0.01 base + Arweave storage cost
   */
  async uploadData(data: {
    data: string;
    content_type?: string;
    tags?: Record<string, string>;
  }): Promise<UploadResponse> {
    const headers = await this.getPaymentHeaders();
    
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Upload file to Arweave
   * Cost: $0.01 base + Arweave storage cost
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const headers = await this.getPaymentHeaders();
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload/file`, {
      method: 'POST',
      headers: {
        ...headers,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`File upload failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Retrieve data from Arweave
   * Cost: $0.001 in USDC
   */
  async getData(txId: string): Promise<unknown> {
    const headers = await this.getPaymentHeaders();
    
    const response = await fetch(`${this.baseUrl}/data/${txId}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get data: ${error}`);
    }

    // Return raw data - could be JSON, text, binary, etc.
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  /**
   * Query transactions using ArQL
   * Cost: $0.005 in USDC
   */
  async query(queryRequest: QueryRequest): Promise<string[]> {
    const headers = await this.getPaymentHeaders();
    
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(queryRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Query failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get x402 payment headers from wallet
   */
  private async getPaymentHeaders(): Promise<Record<string, string>> {
    if (!this.getX402Headers) {
      throw new Error('Wallet not connected. Please connect your wallet to use paid features.');
    }

    try {
      return await this.getX402Headers();
    } catch {
      throw new Error('Failed to generate payment headers. Please check your wallet connection.');
    }
  }
}

/**
 * Create a storage API client instance
 */
export function createStorageClient(
  walletAddress?: string,
  getX402Headers?: () => Promise<Record<string, string>>
): StorageAPI {
  return new StorageAPI(walletAddress, getX402Headers);
}

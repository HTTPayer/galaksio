/**
 * Galaksio Storage API Types
 * x402-powered permanent storage on Arweave
 */

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

export interface QueryResponse {
  transactions: TransactionInfo[];
  total: number;
}

export interface HealthResponse {
  status: string;
  version?: string;
  [key: string]: unknown;
}

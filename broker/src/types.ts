export type TaskType = "compute" | "storage";

export interface A2AEnvelope<T = any> {
  type: string;
  agent_id?: string;
  a2a_version?: string;
  payload: T;
  meta?: Record<string, any>;
}

export interface PaymentAccept {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  description?: string;
}

export interface X402PaymentChallenge {
  accepts: PaymentAccept[];
}

export interface RunTaskPayload {
  taskType: TaskType;
  fileUrl?: string;
  fileInline?: string;
  language?: "python" | "node" | "bash";
  dependencies?: string[];
  provider?: string;
  maxCostUsd?: number;
  meta?: Record<string, any>;

  // Optional resource fields for quoting
  cpu?: number;
  memory?: number;
  storage?: number;
  size?: number;
  duration_days?: number;
  permanent?: boolean;
  gpu?: string;
}

export interface Quote {
  provider: string;
  priceUsd: number;
  estimatedDuration?: number;
  available: boolean;
}

export interface ExecutorResponse {
  jobId: string;
  status: string;
  result?: any;
  error?: string;
}

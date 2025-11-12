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

// ==================== X402 Response Types ====================

export interface FieldDef {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>; // for nested objects
}

export interface Accepts {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;

  // Optionally, schema describing the input and output expectations for the paid endpoint.
  outputSchema?: {
    input: {
      type: "http";
      method: "GET" | "POST";
      bodyType?: "json" | "form-data" | "multipart-form-data" | "text" | "binary";
      queryParams?: Record<string, FieldDef>;
      bodyFields?: Record<string, FieldDef>;
      headerFields?: Record<string, FieldDef>;
    };
    output?: Record<string, any>;
  };

  // Optionally, additional custom data the provider wants to include.
  extra?: Record<string, any>;
}

export interface X402Response {
  x402Version: number;
  error?: string;
  accepts?: Array<Accepts>;
  payer?: string;
}

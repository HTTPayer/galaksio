/**
 * Galaksio Compute API Types
 * Code execution backend
 */

export type Language = 'python' | 'javascript';

export type GPUType = 'l40s' | 'a100';

export type JobState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ComputeHealthResponse {
  status: string;
  c3_connected: boolean;
  user?: string;
  balance?: unknown;
}

export interface ExecuteRequest {
  code: string;
  language: Language;
  gpu_type?: GPUType;
  gpu_count?: number; // 1-8
  timeout?: number; // 1-3600 seconds
  is_base64?: boolean;
  on_demand?: boolean;
}

export interface ExecuteResponse {
  job_id: string;
  status: string;
  output: string | null;
  error: string | null;
  execution_time: number | null;
}

export interface AsyncExecuteRequest {
  code: string;
  language: Language;
  gpu_type?: GPUType;
  gpu_count?: number;
  timeout?: number;
  is_base64?: boolean;
  on_demand?: boolean;
}

export interface AsyncExecuteResponse {
  job_id: string;
}

export interface JobStatus {
  job_id: string;
  state: string; // pending, running, completed, failed, cancelled
  output: string | null;
  error: string | null;
}

export interface JobListResponse {
  jobs: JobStatus[];
  total: number;
}

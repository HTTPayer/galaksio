/**
 * Galaksio Compute API Client
 * Code execution backend
 */

import type {
  ComputeHealthResponse,
  ExecuteRequest,
  ExecuteResponse,
  AsyncExecuteRequest,
  AsyncExecuteResponse,
  JobStatus,
} from '@/types/compute';

const COMPUTE_API_BASE = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:8000';

/**
 * Compute API client
 */
export class ComputeAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || COMPUTE_API_BASE;
  }

  /**
   * Get API health status
   */
  async health(): Promise<ComputeHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Execute code synchronously
   * Blocks until execution completes or times out
   */
  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    const response = await fetch(`${this.baseUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Execution failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Execute code asynchronously
   * Returns immediately with a job_id to poll for results
   */
  async executeAsync(request: AsyncExecuteRequest): Promise<AsyncExecuteResponse> {
    const response = await fetch(`${this.baseUrl}/execute/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Async execution failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get job status by job_id
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get job status: ${error}`);
    }

    return response.json();
  }

  /**
   * List recent jobs
   */
  async listJobs(limit: number = 10): Promise<JobStatus[]> {
    const response = await fetch(`${this.baseUrl}/jobs?limit=${limit}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list jobs: ${error}`);
    }

    const data = await response.json();
    
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data.jobs && Array.isArray(data.jobs)) {
      return data.jobs;
    }
    
    return [];
  }

  /**
   * Poll job status until completion
   * @param jobId - The job ID to poll
   * @param intervalMs - Polling interval in milliseconds (default: 2000)
   * @param timeoutMs - Maximum time to poll in milliseconds (default: 300000 = 5 minutes)
   * @returns Final job status
   */
  async pollJobUntilComplete(
    jobId: string,
    intervalMs: number = 2000,
    timeoutMs: number = 300000
  ): Promise<JobStatus> {
    const startTime = Date.now();

    while (true) {
      const status = await this.getJobStatus(jobId);

      // Check if job is in a terminal state
      if (status.state === 'completed' || status.state === 'failed' || status.state === 'cancelled') {
        return status;
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Polling timeout after ${timeoutMs}ms`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}

// Singleton instance
export const computeAPI = new ComputeAPI();

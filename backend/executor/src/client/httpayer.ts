import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { PaymentChallenge } from "../types.js";

export interface HTTPayerConfig {
  routerUrl: string;
  apiKey: string;
  walletPrivateKey?: string;
}

export class HTTPayerClient {
  private config: HTTPayerConfig;

  constructor(config: HTTPayerConfig) {
    this.config = config;
  }

  /**
   * Make an HTTP request through the HTTPayer router
   * Automatically handles 402 payment challenges
   */
  async request<T = any>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> {
    const payload = {
      method: method.toUpperCase(),
      api_url: url,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...(data && { data }),
    };

    console.log(`[httpayer] Making ${method} request to ${url}`);
    console.log(`[httpayer] Payload:`, JSON.stringify(payload, null, 2));

    try {
      // First attempt - send request through httpayer proxy
      const response = await axios.post<T>(
        `${this.config.routerUrl}/proxy`,
        payload,
        {
          headers: {
            "x-api-key": this.config.apiKey,
            "Content-Type": "application/json",
          },
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        }
      );

      // Check if we got a 402 payment challenge
      if (response.status === 402) {
        console.log("[httpayer] Received 402 Payment Required");
        const challenge = response.data as unknown as PaymentChallenge;

        if (challenge.accepts && challenge.accepts.length > 0) {
          const paymentOption = challenge.accepts[0];
          console.log(
            `[httpayer] Payment required: ${paymentOption.maxAmountRequired} to ${paymentOption.payTo}`
          );
          console.log(`[httpayer] Network: ${paymentOption.network}`);
          console.log(`[httpayer] Asset: ${paymentOption.asset}`);

          // TODO: Implement automatic payment handling here
          // For now, we'll throw an error with the payment details
          throw new Error(
            `Payment required: ${paymentOption.description || "Payment needed to complete request"}. ` +
              `Amount: ${paymentOption.maxAmountRequired} on ${paymentOption.network}. ` +
              `Pay to: ${paymentOption.payTo}`
          );
        }
      }

      if (response.status >= 400) {
        console.error(
          `[httpayer] Request failed with status ${response.status}:`,
          response.data
        );
        throw new Error(
          `HTTPayer request failed: ${response.status} - ${JSON.stringify(response.data)}`
        );
      }

      console.log(`[httpayer] Request successful: ${response.status}`);
      return response;
    } catch (error: any) {
      if (error.response?.status === 402) {
        // Re-throw 402 errors with payment details
        throw error;
      }
      console.error("[httpayer] Request error:", error.message);
      throw new Error(`HTTPayer request failed: ${error.message}`);
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(
    url: string,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> {
    return this.request<T>("GET", url, undefined, headers);
  }

  async post<T = any>(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> {
    return this.request<T>("POST", url, data, headers);
  }

  async put<T = any>(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> {
    return this.request<T>("PUT", url, data, headers);
  }

  async delete<T = any>(
    url: string,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> {
    return this.request<T>("DELETE", url, undefined, headers);
  }
}

/**
 * Create a configured HTTPayer client from environment variables
 */
export function createHTTPayerClient(): HTTPayerClient {
  const routerUrl = process.env.HTTPAYER_ROUTER_URL || "http://localhost:3000";
  const apiKey = process.env.HTTPAYER_API_KEY || "";
  const walletPrivateKey = process.env.EXECUTOR_PRIVATE_KEY;

  if (!apiKey) {
    console.warn(
      "[httpayer] Warning: HTTPAYER_API_KEY not set, requests may fail"
    );
  }

  return new HTTPayerClient({
    routerUrl,
    apiKey,
    walletPrivateKey,
  });
}

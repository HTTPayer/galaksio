import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Galaksio Broker API",
      version: "2.0.0",
      description: `
# Galaksio Broker API

The Galaksio Broker is a payment-gated API that orchestrates distributed compute and storage tasks across multiple providers. It implements the X402 payment protocol for micropayments.

## Key Features

- **Pay-per-use**: All endpoints require payment via X402 protocol
- **Multi-provider**: Automatically selects the best provider based on price and availability
- **Storage**: Store files on IPFS, Arweave (via xCache)
- **Compute**: Execute code in sandboxed environments (via Merit Systems)
- **Cache**: Create distributed cache instances (via xCache)
- **Job Tracking**: Track job status and retrieve results

## Payment Flow

1. Make a request to any endpoint (e.g., POST /store or POST /run)
2. If unpaid, receive a 402 Payment Required response with payment instructions
3. Submit payment using X402 protocol (handled by x402-express middleware)
4. Request is automatically re-processed once payment is verified
5. Receive the result in the response

## X402 Payment Protocol

All payments are handled via the X402 protocol:
- Wallet: 0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F
- Facilitator: https://x402.org/facilitator
- Dynamic pricing based on task requirements
      `,
      contact: {
        name: "Galaksio Support",
        url: "https://github.com/yourusername/galaksio",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000",
        description: "Current server",
      },
      {
        url: "https://broker.galaksio.cloud",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check and service status",
      },
      {
        name: "Storage",
        description: "File storage operations (IPFS, Arweave)",
      },
      {
        name: "Compute",
        description: "Code execution operations",
      },
      {
        name: "Cache",
        description: "Cache instance creation and management",
      },
      {
        name: "Jobs",
        description: "Job status and management",
      },
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              description: "Service health status",
            },
            service: {
              type: "string",
              description: "Service name",
              example: "galaksio-broker",
            },
            version: {
              type: "string",
              description: "API version",
              example: "2.0.0",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Current server timestamp",
            },
          },
        },
        StoreRequest: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "string",
              description: "Base64-encoded file data or raw string to store",
              example: "SGVsbG8gV29ybGQh",
            },
            filename: {
              type: "string",
              description: "Optional filename for the stored data",
              example: "hello.txt",
            },
            options: {
              type: "object",
              properties: {
                permanent: {
                  type: "boolean",
                  description: "Whether to store permanently (Arweave) or temporarily (IPFS)",
                  default: false,
                },
                ttl: {
                  type: "number",
                  description: "Time-to-live in seconds for temporary storage",
                  default: 3600,
                  example: 86400,
                },
              },
            },
          },
        },
        StorePaymentRequiredResponse: {
          type: "object",
          properties: {
            x402Version: {
              type: "number",
              description: "X402 protocol version",
              example: 1,
            },
            accepts: {
              type: "array",
              description: "Array of accepted payment methods",
              items: {
                type: "object",
                properties: {
                  scheme: {
                    type: "string",
                    example: "exact",
                  },
                  network: {
                    type: "string",
                    example: "base",
                  },
                  maxAmountRequired: {
                    type: "string",
                    example: "1000000000000000",
                  },
                  resource: {
                    type: "string",
                    example: "/store",
                  },
                  description: {
                    type: "string",
                    example: "Store file on decentralized storage",
                  },
                  mimeType: {
                    type: "string",
                    example: "application/json",
                  },
                  payTo: {
                    type: "string",
                    example: "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
                  },
                  maxTimeoutSeconds: {
                    type: "number",
                    example: 300,
                  },
                  asset: {
                    type: "string",
                    example: "0x036CbD53842c5426634e7929541eC2318b4c2C8F",
                  },
                },
              },
            },
          },
        },
        StoreSuccessResponse: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
              description: "Job identifier",
            },
            status: {
              type: "string",
              enum: ["completed"],
            },
            result: {
              type: "object",
              properties: {
                cid: {
                  type: "string",
                  description: "Content identifier (IPFS CID or Arweave transaction ID)",
                  example: "QmXxxx...",
                },
                url: {
                  type: "string",
                  description: "Public URL to access the stored file",
                  example: "https://ipfs.io/ipfs/QmXxxx...",
                },
                provider: {
                  type: "string",
                  description: "Provider that handled the storage",
                },
                size: {
                  type: "number",
                  description: "Size in bytes",
                },
              },
            },
          },
        },
        RunRequest: {
          type: "object",
          required: ["code"],
          properties: {
            code: {
              type: "string",
              description: "Code snippet to execute (can be plain text or base64)",
              example: 'print("Hello from Galaksio!")',
            },
            language: {
              type: "string",
              description: "Programming language",
              enum: ["python", "javascript", "bash"],
              default: "python",
            },
          },
        },
        RunPaymentRequiredResponse: {
          type: "object",
          properties: {
            x402Version: {
              type: "number",
              description: "X402 protocol version",
              example: 1,
            },
            accepts: {
              type: "array",
              description: "Array of accepted payment methods",
              items: {
                type: "object",
                properties: {
                  scheme: {
                    type: "string",
                    example: "exact",
                  },
                  network: {
                    type: "string",
                    example: "base",
                  },
                  maxAmountRequired: {
                    type: "string",
                    example: "1000000000000000",
                  },
                  resource: {
                    type: "string",
                    example: "/run",
                  },
                  description: {
                    type: "string",
                    example: "Execute code in sandboxed environment",
                  },
                  mimeType: {
                    type: "string",
                    example: "application/json",
                  },
                  payTo: {
                    type: "string",
                    example: "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
                  },
                  maxTimeoutSeconds: {
                    type: "number",
                    example: 300,
                  },
                  asset: {
                    type: "string",
                    example: "0x036CbD53842c5426634e7929541eC2318b4c2C8F",
                  },
                },
              },
            },
          },
        },
        RunSuccessResponse: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
            },
            status: {
              type: "string",
              enum: ["completed"],
            },
            result: {
              type: "object",
              properties: {
                stdout: {
                  type: "string",
                  description: "Standard output from code execution",
                  example: "Hello from Galaksio!",
                },
                stderr: {
                  type: "string",
                  description: "Standard error output",
                },
                exitCode: {
                  type: "number",
                  description: "Exit code of the execution",
                  example: 0,
                },
                executionTime: {
                  type: "number",
                  description: "Execution time in milliseconds",
                  example: 123,
                },
              },
            },
          },
        },
        CacheRequest: {
          type: "object",
          properties: {
            region: {
              type: "string",
              description: "AWS region for cache instance",
              default: "us-east-1",
              example: "us-east-1",
              enum: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
            },
          },
        },
        CachePaymentRequiredResponse: {
          type: "object",
          properties: {
            x402Version: {
              type: "number",
              description: "X402 protocol version",
              example: 1,
            },
            accepts: {
              type: "array",
              description: "Array of accepted payment methods",
              items: {
                type: "object",
                properties: {
                  scheme: {
                    type: "string",
                    example: "exact",
                  },
                  network: {
                    type: "string",
                    example: "base",
                  },
                  maxAmountRequired: {
                    type: "string",
                    example: "1000000000000000",
                  },
                  resource: {
                    type: "string",
                    example: "/cache",
                  },
                  description: {
                    type: "string",
                    example: "Create cache instance",
                  },
                  mimeType: {
                    type: "string",
                    example: "application/json",
                  },
                  payTo: {
                    type: "string",
                    example: "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
                  },
                  maxTimeoutSeconds: {
                    type: "number",
                    example: 300,
                  },
                  asset: {
                    type: "string",
                    example: "0x036CbD53842c5426634e7929541eC2318b4c2C8F",
                  },
                },
              },
            },
          },
        },
        CacheSuccessResponse: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
              description: "Job identifier",
            },
            status: {
              type: "string",
              enum: ["completed"],
            },
            result: {
              type: "object",
              properties: {
                cacheId: {
                  type: "string",
                  description: "Unique cache instance identifier",
                  example: "cache_abc123xyz",
                },
                region: {
                  type: "string",
                  description: "Region where cache was created",
                  example: "us-east-1",
                },
                endpoint: {
                  type: "string",
                  description: "Cache endpoint URL",
                  example: "https://cache.xcache.io/cache_abc123xyz",
                },
                provider: {
                  type: "string",
                  description: "Cache provider",
                  example: "xcache",
                },
              },
            },
          },
        },
        JobStatusResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Job ID",
            },
            requester: {
              type: "string",
              description: "Wallet address or identifier of requester",
            },
            status: {
              type: "string",
              enum: [
                "awaiting_payment",
                "payment_required",
                "running",
                "completed",
                "failed",
              ],
              description: "Current job status",
            },
            provider: {
              type: "string",
              description: "Provider handling the job",
            },
            quote: {
              type: "object",
              description: "Quote information",
            },
            result: {
              type: "object",
              description: "Job result (if completed)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
      securitySchemes: {
        WalletAddress: {
          type: "apiKey",
          in: "header",
          name: "x-wallet",
          description: "Optional wallet address for tracking requests",
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          description: "Check if the broker service is running and get basic service information",
          operationId: "healthCheck",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/HealthResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/store": {
        post: {
          tags: ["Storage"],
          summary: "Store file",
          description: `
Store a file on decentralized storage (IPFS or Arweave).

**Payment Required**: This endpoint requires payment via X402 protocol.

**Flow**:
1. First request returns 402 with payment details
2. Client submits payment via X402
3. Request is re-processed and file is stored
4. Returns storage location (CID/URL)

**Providers**:
- IPFS: Temporary storage (default, cheaper)
- Arweave: Permanent storage (higher cost)
- xCache: Hybrid caching layer
          `,
          operationId: "storeFile",
          security: [{ WalletAddress: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StoreRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "File stored successfully (payment verified)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/StoreSuccessResponse",
                  },
                },
              },
            },
            "400": {
              description: "Bad request - missing required fields",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "402": {
              description: "Payment required - X402 payment instructions included",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/StorePaymentRequiredResponse",
                  },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "503": {
              description: "No providers available",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/run": {
        post: {
          tags: ["Compute"],
          summary: "Execute code",
          description: `
Execute code in a sandboxed environment.

**Payment Required**: This endpoint requires payment via X402 protocol.

**Supported Languages**:
- Python (default)
- JavaScript/Node.js
- Bash

**Flow**:
1. First request returns 402 with payment details
2. Client submits payment via X402
3. Code is executed in a secure sandbox
4. Returns execution output (stdout, stderr, exit code)

**Limitations**:
- Execution timeout: 60 seconds
- Memory limit: 512MB
- No network access in sandbox
          `,
          operationId: "runCode",
          security: [{ WalletAddress: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RunRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Code executed successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RunSuccessResponse",
                  },
                },
              },
            },
            "400": {
              description: "Bad request - code is required",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "402": {
              description: "Payment required",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RunPaymentRequiredResponse",
                  },
                },
              },
            },
            "500": {
              description: "Execution failed",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/cache": {
        post: {
          tags: ["Cache"],
          summary: "Create cache instance",
          description: `
Create a new distributed cache instance.

**Payment Required**: This endpoint requires payment via X402 protocol.

**Flow**:
1. First request returns 402 with payment details (X402Response format)
2. Client submits payment via X402
3. Cache instance is created
4. Returns cache instance details (ID, endpoint, region)

**Provider**:
- xCache: Distributed key-value cache service

**Use Cases**:
- Temporary data storage
- Session management
- API response caching
- Rate limiting counters
          `,
          operationId: "createCache",
          security: [{ WalletAddress: [] }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CacheRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Cache instance created successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CacheSuccessResponse",
                  },
                },
              },
            },
            "402": {
              description: "Payment required - X402 payment instructions included",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CachePaymentRequiredResponse",
                  },
                },
              },
            },
            "500": {
              description: "Cache creation failed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      x402Version: {
                        type: "number",
                        example: 1,
                      },
                      error: {
                        type: "string",
                        description: "Error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/status/{id}": {
        get: {
          tags: ["Jobs"],
          summary: "Get job status",
          description: "Retrieve the status and details of a previously submitted job",
          operationId: "getJobStatus",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Job ID returned from /store or /run endpoints",
              schema: {
                type: "string",
                format: "uuid",
              },
            },
          ],
          responses: {
            "200": {
              description: "Job status retrieved",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/JobStatusResponse",
                  },
                },
              },
            },
            "404": {
              description: "Job not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // Path to route files for additional JSDoc annotations
};

export const swaggerSpec = swaggerJsdoc(options);

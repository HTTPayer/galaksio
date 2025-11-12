// import { createWalletClient, http, parseUnits } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { base } from "viem/chains";
// // import { createPaymentHeader } from "x402-fetch";
// import axios from "axios";

// /**
//  * Make an x402 payment to a target API
//  * This uses the broker's wallet to pay for services on behalf of clients
//  */
// export async function makeX402Payment(
//   targetUrl: string,
//   method: string,
//   paymentRequirements: any,
//   requestBody?: any
// ): Promise<any> {
//   // Get broker's private key from environment
//   const privateKey = process.env.BROKER_PRIVATE_KEY;
//   if (!privateKey) {
//     throw new Error("BROKER_PRIVATE_KEY not set");
//   }

//   // Create wallet client for signing
//   const account = privateKeyToAccount(privateKey as `0x${string}`);
//   const walletClient = createWalletClient({
//     account,
//     chain: base,
//     transport: http(),
//   });

//   console.log("[x402Payment] Creating payment header for:", targetUrl);
//   console.log("[x402Payment] Payment requirements:", paymentRequirements);

//   // Create payment header
//   const paymentHeader = await createPaymentHeader(
//     walletClient as any,
//     1, // x402Version
//     paymentRequirements
//   );

//   console.log("[x402Payment] Payment header created, making request...");

//   // Make the request with payment header
//   const response = await axios({
//     method: method.toUpperCase(),
//     url: targetUrl,
//     data: requestBody,
//     headers: {
//       "Content-Type": "application/json",
//       "X-PAYMENT": paymentHeader,
//     },
//     validateStatus: (status) => status < 500, // Don't throw on 4xx
//   });

//   if (response.status === 402) {
//     throw new Error(
//       `Payment was not accepted by ${targetUrl}: ${JSON.stringify(response.data)}`
//     );
//   }

//   if (response.status >= 400) {
//     throw new Error(
//       `Request failed with status ${response.status}: ${JSON.stringify(response.data)}`
//     );
//   }

//   console.log("[x402Payment] Payment successful, received response");
//   return response.data;
// }

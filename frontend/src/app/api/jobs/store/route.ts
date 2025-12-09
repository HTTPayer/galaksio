/**
 * API endpoint to save storage jobs from broker responses
 * POST /api/jobs/store
 * 
 * Expected payload from broker (per reduced spec):
 * {
 *   "jobId": "store_456",
 *   "status": "completed",
 *   "result": {
 *     "cid": "QmXxxx...",
 *     "url": "https://ipfs.io/ipfs/QmXxxx...",
 *     "provider": "spuro",
 *     "size": 1234
 *   }
 * }
 * 
 * Safe fields for DB (per reduced spec):
 * - jobId, status
 * - result.cid, result.url, result.provider, result.size
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAccount } from "@/lib/userAccounts";
import type { BrokerStoreResponse } from "@/types/broker";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BrokerStoreResponse;

    // Get or create user account
    const account = await getOrCreateUserAccount();

    // Create job record in database
    const job = await prisma.userJob.create({
      data: {
        userAccountId: account.id,
        kind: "store",
        brokerJobId: body.jobId,
        status: body.status,
        txId: body.result.cid,
        url: body.result.url,
        provider: body.result.provider,
        size: body.result.size,
        rawResult: JSON.parse(JSON.stringify(body)),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err: unknown) {
    console.error("Error saving store job:", err);
    return NextResponse.json(
      { 
        error: "Error saving store job", 
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}

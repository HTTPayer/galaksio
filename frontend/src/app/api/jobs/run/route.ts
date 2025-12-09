/**
 * API endpoint to save compute/run jobs from broker responses
 * POST /api/jobs/run
 * 
 * Expected payload from broker (per actual API docs):
 * {
 *   "jobId": "abc123",
 *   "status": "completed",
 *   "result": {
 *     "stdout": "Hello from Galaksio!",
 *     "stderr": "",
 *     "exitCode": 0,
 *     "executionTime": 123
 *   }
 * }
 * 
 * Safe fields for DB (per API docs):
 * - jobId, status
 * - result.stdout, result.stderr, result.exitCode, result.executionTime
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAccount } from "@/lib/userAccounts";
import type { BrokerRunResponse } from "@/types/broker";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BrokerRunResponse;

    // Get or create user account
    const account = await getOrCreateUserAccount();

    // Handle both output formats: output field or stdout/stderr fields
    const stdout = body.result.stdout || (body.result as any).output || null;
    const stderr = body.result.stderr || null;
    const exitCode = body.result.exitCode ?? null;
    
    // Create job record in database
    const job = await prisma.userJob.create({
      data: {
        userAccountId: account.id,
        kind: "run",
        brokerJobId: body.jobId,
        status: body.status,
        stdout,
        stderr,
        exitCode,
        executionTimeMs: body.result.executionTime,
        rawResult: JSON.parse(JSON.stringify(body)),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err: unknown) {
    console.error("Error saving run job:", err);
    return NextResponse.json(
      { 
        error: "Error saving run job", 
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}

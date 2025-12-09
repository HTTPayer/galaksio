/**
 * API endpoint to refresh job status from broker
 * PATCH /api/jobs/[brokerJobId]/refresh
 * 
 * Fetches the latest status from the broker and updates the database
 * 
 * IMPORTANT: This is the ONLY route that should call broker job status endpoints.
 * Frontend UI must NEVER call /job/{id} or /status/{id} directly.
 * 
 * Expected broker response (from GET /job/{jobId} or GET /status/{id}):
 * {
 *   "id": "store_456",
 *   "status": "completed | queued | running | failed",
 *   "provider": "spuro",
 *   "result": { ... },
 *   "quote": { ... },
 *   "requester": "0x1234...",
 *   "createdAt": "...",
 *   "updatedAt": "..."
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { BrokerJobStatusResponse } from "@/types/broker";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ brokerJobId: string }> }
) {
  try {
    const { brokerJobId } = await context.params;
    console.log('[REFRESH] Starting refresh for job:', brokerJobId);

    // Get authenticated session
    const session = await auth();
    console.log('[REFRESH] Session:', session ? 'authenticated' : 'not authenticated');
    
    if (!session?.user?.id) {
      console.error('[REFRESH] No session or user ID');
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get or create user account
    const externalId = String(session.user.id);
    console.log('[REFRESH] External ID:', externalId);
    
    let account = await prisma.userAccount.findUnique({
      where: { externalId },
    });

    if (!account) {
      console.log('[REFRESH] Creating new account');
      account = await prisma.userAccount.create({
        data: {
          externalId,
          provider: "github",
        },
      });
    }
    console.log('[REFRESH] Account ID:', account.id);

    // Get broker URL from env (don't need body)
    const brokerUrl = process.env.NEXT_PUBLIC_BROKER_API_URL;
    console.log('[REFRESH] Broker URL:', brokerUrl);

    if (!brokerUrl) {
      console.error('[REFRESH] Broker URL not configured');
      return NextResponse.json(
        { error: "Broker URL not configured" },
        { status: 500 }
      );
    }

    // Fetch status from broker
    // Try both /job/{id} and /status/{id} endpoints
    let brokerResponse: BrokerJobStatusResponse | null = null;
    
    console.log('[REFRESH] Fetching from broker:', `${brokerUrl}/job/${brokerJobId}`);
    try {
      const response = await fetch(`${brokerUrl}/job/${brokerJobId}`);
      console.log('[REFRESH] /job response status:', response.status);
      if (response.ok) {
        brokerResponse = await response.json();
        console.log('[REFRESH] Got response from /job');
      }
    } catch (err) {
      console.warn(`[REFRESH] Failed to fetch from /job/${brokerJobId}:`, err);
    }

    if (!brokerResponse) {
      console.log('[REFRESH] Trying /status endpoint');
      try {
        const response = await fetch(`${brokerUrl}/status/${brokerJobId}`);
        console.log('[REFRESH] /status response status:', response.status);
        if (response.ok) {
          brokerResponse = await response.json();
          console.log('[REFRESH] Got response from /status');
        }
      } catch (err) {
        console.warn(`[REFRESH] Failed to fetch from /status/${brokerJobId}:`, err);
      }
    }

    if (!brokerResponse) {
      console.error('[REFRESH] Failed to fetch from both endpoints');
      return NextResponse.json(
        { error: "Failed to fetch job status from broker" },
        { status: 502 }
      );
    }

    console.log('[REFRESH] Broker response status:', brokerResponse.status);
    console.log('[REFRESH] Full broker response:', JSON.stringify(brokerResponse, null, 2));

    // Extract result data if available
    const result = brokerResponse.result as any;
    console.log('[REFRESH] Result object:', result ? JSON.stringify(result, null, 2) : 'null');
    
    const updateData: any = {
      status: brokerResponse.status,
      provider: brokerResponse.provider,
      rawStatus: JSON.parse(JSON.stringify(brokerResponse)),
    };

    // Update compute job fields if result exists
    if (result) {
      // Handle nested result structure from broker
      const actualResult = result.result?.result || result.result || result;
      
      // Handle both output formats
      if (actualResult.output) {
        updateData.stdout = actualResult.output;
      } else if (actualResult.stdout) {
        updateData.stdout = actualResult.stdout;
      }
      
      if (actualResult.stderr) {
        updateData.stderr = actualResult.stderr;
      }
      
      // Exit code - check success status
      if (actualResult.exitCode !== undefined && actualResult.exitCode !== null) {
        updateData.exitCode = actualResult.exitCode;
      } else if (actualResult.success !== undefined) {
        // Convert success boolean to exit code
        updateData.exitCode = actualResult.success ? 0 : 1;
      } else if (actualResult.status === 'succeeded') {
        updateData.exitCode = 0;
      }
      
      // Execution time
      if (actualResult.executionTime !== undefined && actualResult.executionTime !== null) {
        updateData.executionTimeMs = actualResult.executionTime;
      } else if (actualResult.execution_time !== undefined && actualResult.execution_time !== null) {
        // Convert seconds to milliseconds
        updateData.executionTimeMs = Math.round(actualResult.execution_time * 1000);
      }

      // Storage job fields
      if (result.cid) {
        updateData.txId = result.cid;
      }
      if (result.url) {
        updateData.url = result.url;
      }
      if (result.size !== undefined && result.size !== null) {
        updateData.size = result.size;
      }
    }

    console.log('[REFRESH] Update data to save:', JSON.stringify(updateData, null, 2));

    // Update job in database
    console.log('[REFRESH] Updating job in database');
    const updatedJob = await prisma.userJob.updateMany({
      where: { 
        brokerJobId,
        userAccountId: account.id, // Ensure user owns this job
      },
      data: updateData,
    });

    console.log('[REFRESH] Updated job count:', updatedJob.count);
    if (updatedJob.count === 0) {
      console.error('[REFRESH] Job not found or access denied');
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch and return the updated job
    console.log('[REFRESH] Fetching updated job');
    const job = await prisma.userJob.findFirst({
      where: { 
        brokerJobId,
        userAccountId: account.id,
      },
    });

    console.log('[REFRESH] Success, returning job');
    return NextResponse.json(job);
  } catch (err: unknown) {
    console.error("[REFRESH] Error refreshing job status:", err);
    console.error("[REFRESH] Error stack:", err instanceof Error ? err.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Error refreshing job status", 
        details: err instanceof Error ? err.message : String(err) 
      },
      { status: 500 }
    );
  }
}

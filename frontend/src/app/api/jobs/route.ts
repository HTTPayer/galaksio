/**
 * API endpoint to list user's jobs
 * GET /api/jobs
 * 
 * Query params:
 * - kind: Optional filter by job kind ('run' | 'store' | 'cache')
 * 
 * Examples:
 * - GET /api/jobs - List all jobs
 * - GET /api/jobs?kind=store - List only storage jobs (for "My Files")
 * - GET /api/jobs?kind=run - List only compute jobs (for "Compute Jobs")
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAccount } from "@/lib/userAccounts";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind"); // 'run' | 'store' | 'cache' | null

    // Get or create user account
    const account = await getOrCreateUserAccount();

    // Build query filter
    const where: any = { userAccountId: account.id };
    if (kind) {
      where.kind = kind;
    }

    // Fetch jobs with ordering
    const jobs = await prisma.userJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(jobs);
  } catch (err: any) {
    console.error("Error listing jobs:", err);
    return NextResponse.json(
      { 
        error: "Error listing jobs", 
        details: err?.message 
      },
      { status: 500 }
    );
  }
}

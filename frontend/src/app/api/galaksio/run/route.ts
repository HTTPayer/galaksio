import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // In production: forward to your Galaksio API which may return 402 Payment Required
  // For demo we simulate an immediate success payload.
  return NextResponse.json({
    status: "queued",
    provider: "akash|e2b",
    script: body.script,
    group: body.group,
    outputCid: "bafy…",
  });
}

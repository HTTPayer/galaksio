import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Echo incoming cookies for debugging (do NOT enable in production)
  const cookies: Record<string, string | undefined> = {};
  for (const [k, v] of req.cookies) {
    cookies[k] = v?.value;
  }
  try {
    console.log("/api/debug/cookies -> received cookies:", cookies);
  } catch {}
  return NextResponse.json({ ok: true, cookies });
}

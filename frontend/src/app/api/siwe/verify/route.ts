import { NextRequest, NextResponse } from "next/server";
import { jwtSign } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { message, signature, address } = await req.json();
  // TODO: Verify SIWE message properly (recover address, compare). Minimal demo:
  if (!message || !signature || !address)
    return new NextResponse("Bad request", { status: 400 });

  // In production, validate chainId, nonce freshness, domain, and signature with EIP‑191
  const token = await jwtSign({ sub: address, ts: Date.now() });
  // debug log to server console for troubleshooting during dev
  try {
    console.log("SIWE verify: issuing session for", address);
  } catch {}

  const body: Record<string, unknown> = { ok: true };
  // In dev expose token in response body to help debugging (do NOT enable in prod)
  if (process.env.NODE_ENV !== "production") {
    body.token = token;
  }

  const res = NextResponse.json(body);
  res.cookies.set("glx.session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}

// src/app/api/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("glx.session")?.value || "";
  const payload = token ? await jwtVerify(token) : null;

  if (!payload || typeof payload.sub !== "string") {
    return new NextResponse(null, { status: 401 });
  }
  return NextResponse.json({ userId: payload.sub });
}

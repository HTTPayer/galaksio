// src/app/api/auth/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CdpClient } from "@coinbase/cdp-sdk";
import { jwtSign } from "@/lib/jwt";

if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
  throw new Error("CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set");
}

const cdpClient = new CdpClient({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing accessToken" },
        { status: 400 }
      );
    }

    // 1) Validar el token del end-user en SERVIDOR
    const endUser = await cdpClient.endUser.validateAccessToken({ accessToken });

    // 2) Firmar tu sesión (usa el id del endUser como sujeto)
    const payload = {
      // `endUser` type from the CDP SDK may not expose an `id` property in the
      // TypeScript types used here. Cast to `any` for the minimal fix so we can
      // use the runtime `id` value returned by the API.
      sub: String((endUser as any).id),
      iat: Math.floor(Date.now() / 1000),
      // exp: Math.floor(Date.now()/1000) + 60*60*24*7, // opcional: 7 días
    };
    const jwt = await jwtSign(payload);

    // 3) Setear cookie HttpOnly
    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({ ok: true, endUser });
    res.cookies.set("glx.session", jwt, {
      httpOnly: true,
      secure: isProd,     // en dev debe ser false para localhost
      sameSite: "lax",
      path: "/",
      // maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: any) {
    const msg =
      error?.errorMessage ?? error?.message ?? "Unknown error validating token";
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
}

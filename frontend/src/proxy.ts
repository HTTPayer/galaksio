// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "@/lib/jwt";

export const config = {
  matcher: [
    "/dashboard/:path*",     // protege tu página
    "/api/galaksio/:path*",  // protege tus APIs de negocio
  ],
};

const ONBOARDING_PATH = "/"; // tu landing/embedded loader

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("glx.session")?.value || "";
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (!token) return handleNoSession(req, isApi);

  const payload = await safeVerify(token);
  if (!payload || typeof payload.sub !== "string") {
    return handleNoSession(req, isApi);
  }

  return NextResponse.next();
}

function handleNoSession(req: NextRequest, isApi: boolean) {
  if (isApi) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = ONBOARDING_PATH;
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url, { status: 308 });
}

async function safeVerify(token: string) {
  try {
    return await jwtVerify(token);
  } catch {
    return null;
  }
}


export const middleware = proxy;
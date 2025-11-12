import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("glx.session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return res;
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, model } = await req.json();
  // TODO: persist agent in DB; charge via HTTPayer if needed
  return NextResponse.json({
    id: "agt_" + Math.random().toString(36).slice(2),
    name,
    model,
  });
}

/** API route: returns and replaces locally persisted reply rules. */
import { NextRequest, NextResponse } from "next/server";
import { getRules, replaceRules } from "@/lib/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getRules(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { rules?: unknown };
    return NextResponse.json(await replaceRules(body.rules), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ قواعد الرد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

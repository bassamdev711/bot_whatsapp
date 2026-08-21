/** API route: reads and saves interactive reply flows. */
import { NextRequest, NextResponse } from "next/server";
import { getFlows, replaceFlows } from "@/lib/flows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getFlows(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { flows?: unknown };
    return NextResponse.json(await replaceFlows(body.flows), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ تدفقات الرد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

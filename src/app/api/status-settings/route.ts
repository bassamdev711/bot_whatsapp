/** API route: reads and saves the explicit status-viewing/reaction settings. */
import { NextRequest, NextResponse } from "next/server";
import { getStatusSettings, replaceStatusSettings } from "@/lib/status-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getStatusSettings(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json(await replaceStatusSettings(await request.json()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ إعدادات الحالات.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

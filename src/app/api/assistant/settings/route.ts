/** API route: controlled settings for Bassam's personal assistant. */
import { NextResponse } from "next/server";
import { getAssistantSettings, saveAssistantSettings, type AssistantSettings } from "@/lib/assistant-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAssistantSettings(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const input = await request.json() as Partial<AssistantSettings>;
  return NextResponse.json(await saveAssistantSettings(input), { headers: { "Cache-Control": "no-store" } });
}

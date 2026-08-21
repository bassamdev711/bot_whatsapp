/** API route: an opt-in, server-side Gemini conversation with no execution tools. */
import { NextResponse } from "next/server";
import { askAssistant, type AssistantMessage } from "@/lib/assistant";
import { getAssistantSettings } from "@/lib/assistant-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { messages?: AssistantMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const settings = await getAssistantSettings();
    const reply = await askAssistant(settings, messages);
    return NextResponse.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تشغيل المساعد.";
    const status = message.includes("معطّل") ? 403 : message.includes("مفتاح Gemini") ? 503 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

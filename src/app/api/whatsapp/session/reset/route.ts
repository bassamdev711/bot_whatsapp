/** API route: explicitly ends a local WhatsApp session and clears its stored credentials. */
import { NextResponse } from "next/server";
import { closeSession } from "@/lib/whatsapp";
import { hasWorkerConfiguration, resetWorkerSession } from "@/lib/worker-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = hasWorkerConfiguration() ? await resetWorkerSession() : await closeSession();
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إعادة ضبط عامل واتساب.";
    return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

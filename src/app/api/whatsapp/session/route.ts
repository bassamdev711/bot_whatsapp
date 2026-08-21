/** API route: serves current session state and begins an explicit QR/pairing-code link flow. */
import { NextRequest, NextResponse } from "next/server";
import { beginSession, getSession } from "@/lib/whatsapp";
import { beginWorkerSession, getWorkerSession, hasWorkerConfiguration } from "@/lib/worker-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = hasWorkerConfiguration() ? await getWorkerSession() : getSession();
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر الوصول إلى عامل واتساب.";
    return NextResponse.json({ status: "error", error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { method?: "qr" | "pairing"; phone?: string };
    const method = body.method ?? "qr";
    if (method !== "qr" && method !== "pairing") return NextResponse.json({ error: "طريقة الربط غير صالحة." }, { status: 400 });
    const session = hasWorkerConfiguration()
      ? await beginWorkerSession({ method, phone: body.phone })
      : await beginSession(method, body.phone);
    return NextResponse.json(session, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر بدء جلسة واتساب.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

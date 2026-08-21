/** API route: serves current session state and begins an explicit QR/pairing-code link flow. */
import { NextRequest, NextResponse } from "next/server";
import { beginSession, getSession } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSession(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { method?: "qr" | "pairing"; phone?: string };
    const method = body.method ?? "qr";
    if (method !== "qr" && method !== "pairing") return NextResponse.json({ error: "طريقة الربط غير صالحة." }, { status: 400 });
    const session = await beginSession(method, body.phone);
    return NextResponse.json(session, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر بدء جلسة واتساب.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

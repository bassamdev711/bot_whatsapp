/** API route: explicitly ends a local WhatsApp session and clears its stored credentials. */
import { NextResponse } from "next/server";
import { closeSession } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(await closeSession(), { headers: { "Cache-Control": "no-store" } });
}

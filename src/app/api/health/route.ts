/** API route: liveness probe that does not expose session contents. */
import { NextResponse } from "next/server";
import { storageMode } from "@/lib/neon-store";

export async function GET() {
  const storage = await storageMode();
  return NextResponse.json({ ok: storage !== "unavailable", service: "wasla", storage });
}

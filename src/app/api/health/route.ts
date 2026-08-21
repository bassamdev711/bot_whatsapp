/** API route: liveness probe that does not expose session contents. */
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "wasla" });
}

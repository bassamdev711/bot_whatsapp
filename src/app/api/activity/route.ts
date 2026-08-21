/** API route: exposes the durable, user-owned operational activity feed. */
import { NextResponse } from "next/server";
import { clearActivity, getActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getActivity(), { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  await clearActivity();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

/** Durable activity feed for session, message, status, and automation events. */
import { readDocument, writeDocument } from "./neon-store";

export type ActivityEvent = { id: string; type: string; label: string; detail: string; createdAt: string };

export async function getActivity() {
  const raw = await readDocument<unknown>("activity");
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ActivityEvent => Boolean(item && typeof item === "object" && "id" in item && "label" in item && "createdAt" in item)).slice(0, 200);
}

export async function appendActivity(event: ActivityEvent) {
  const events = await getActivity();
  await writeDocument("activity", [event, ...events.filter((item) => item.id !== event.id)].slice(0, 200));
}

export async function clearActivity() {
  await writeDocument("activity", []);
}

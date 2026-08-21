/** Durable activity feed for session, message, status, and automation events. */
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

export type ActivityEvent = { id: string; type: string; label: string; detail: string; createdAt: string };

const dataDirectory = path.join(process.cwd(), ".wasla-data");
const activityPath = path.join(dataDirectory, "activity.json");

async function write(events: ActivityEvent[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${activityPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(events, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, activityPath);
}

export async function getActivity() {
  try {
    const raw = JSON.parse(await readFile(activityPath, "utf8")) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is ActivityEvent => Boolean(item && typeof item === "object" && "id" in item && "label" in item && "createdAt" in item)).slice(0, 200);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function appendActivity(event: ActivityEvent) {
  const events = await getActivity();
  await write([event, ...events.filter((item) => item.id !== event.id)].slice(0, 200));
}

export async function clearActivity() {
  await write([]);
}

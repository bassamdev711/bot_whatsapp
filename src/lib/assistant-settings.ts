/** Personal assistant settings: user-controlled, local-first, and deliberately disabled by default. */
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

export type AssistantStrictness = "guided" | "strict" | "locked";
export type AssistantSettings = {
  enabled: boolean;
  ownerName: string;
  strictness: AssistantStrictness;
  allowActivityContext: boolean;
  customInstructions: string;
  updatedAt: string;
};

const dataDirectory = path.join(process.cwd(), ".wasla-data");
const settingsPath = path.join(dataDirectory, "assistant-settings.json");

const defaults = (): AssistantSettings => ({
  enabled: false,
  ownerName: "بسّام",
  strictness: "strict",
  allowActivityContext: false,
  customInstructions: "ساعد بسّام في تنظيم إعدادات وصلة، شرح حالة الربط، واقتراح قواعد واضحة. لا تنفّذ أي إجراء ولا تدّعِ تنفيذ إجراء.",
  updatedAt: new Date().toISOString(),
});

function normalize(input: Partial<AssistantSettings>): AssistantSettings {
  const strictness: AssistantStrictness = input.strictness === "guided" || input.strictness === "locked" ? input.strictness : "strict";
  return {
    enabled: Boolean(input.enabled),
    ownerName: "بسّام",
    strictness,
    allowActivityContext: Boolean(input.allowActivityContext),
    customInstructions: typeof input.customInstructions === "string" ? input.customInstructions.trim().slice(0, 4000) : defaults().customInstructions,
    updatedAt: new Date().toISOString(),
  };
}

async function write(settings: AssistantSettings) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${settingsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, settingsPath);
}

export async function getAssistantSettings() {
  try {
    const parsed = JSON.parse(await readFile(settingsPath, "utf8")) as Partial<AssistantSettings>;
    return { ...defaults(), ...normalize(parsed), updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString() };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaults();
    throw error;
  }
}

export async function saveAssistantSettings(input: Partial<AssistantSettings>) {
  const settings = normalize(input);
  await write(settings);
  return settings;
}

/** Personal assistant settings: user-controlled, local-first, and deliberately disabled by default. */
import { readDocument, writeDocument } from "./neon-store";

export type AssistantStrictness = "guided" | "strict" | "locked";
export type AssistantSettings = {
  enabled: boolean;
  ownerName: string;
  strictness: AssistantStrictness;
  allowActivityContext: boolean;
  customInstructions: string;
  updatedAt: string;
};


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

export async function getAssistantSettings() {
  const parsed = await readDocument<Partial<AssistantSettings>>("assistant-settings");
  if (!parsed) return defaults();
  return { ...defaults(), ...normalize(parsed), updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString() };
}

export async function saveAssistantSettings(input: Partial<AssistantSettings>) {
  const settings = normalize(input);
  await writeDocument("assistant-settings", settings);
  return settings;
}

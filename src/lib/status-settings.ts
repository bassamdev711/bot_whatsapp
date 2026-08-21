/**
 * Persistent, opt-in settings for status viewing and reactions. Defaults are deliberately off.
 */
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

export type StatusMode = "all" | "selected";

export type StatusSettings = {
  enabled: boolean;
  markSeen: boolean;
  sendReaction: boolean;
  defaultReaction: string;
  mode: StatusMode;
  includePhones: string[];
  excludePhones: string[];
  customReactions: Record<string, string>;
  updatedAt: string;
};

const dataDirectory = path.join(process.cwd(), ".wasla-data");
const settingsPath = path.join(dataDirectory, "status-settings.json");

const defaultSettings = (): StatusSettings => ({
  enabled: false,
  markSeen: true,
  sendReaction: true,
  defaultReaction: "❤️",
  mode: "all",
  includePhones: [],
  excludePhones: [],
  customReactions: {},
  updatedAt: new Date().toISOString(),
});

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 18);
}

function normalizePhoneList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizePhone).filter(Boolean))].slice(0, 500);
}

function normalizeReaction(value: unknown, fallback: string) {
  const reaction = String(value ?? fallback).trim();
  return reaction ? Array.from(reaction).slice(0, 8).join("") : fallback;
}

function sanitize(input: Partial<StatusSettings>): StatusSettings {
  const includePhones = normalizePhoneList(input.includePhones);
  const excludePhones = normalizePhoneList(input.excludePhones);
  const rawReactions = input.customReactions && typeof input.customReactions === "object" ? input.customReactions : {};
  const customReactions = Object.entries(rawReactions).reduce<Record<string, string>>((result, [phone, reaction]) => {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone) result[normalizedPhone] = normalizeReaction(reaction, "❤️");
    return result;
  }, {});
  return {
    enabled: Boolean(input.enabled),
    markSeen: input.markSeen !== false,
    sendReaction: input.sendReaction !== false,
    defaultReaction: normalizeReaction(input.defaultReaction, "❤️"),
    mode: input.mode === "selected" ? "selected" : "all",
    includePhones,
    excludePhones,
    customReactions,
    updatedAt: new Date().toISOString(),
  };
}

async function save(settings: StatusSettings) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${settingsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, settingsPath);
}

export async function getStatusSettings() {
  try {
    return sanitize(JSON.parse(await readFile(settingsPath, "utf8")) as Partial<StatusSettings>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const settings = defaultSettings();
    await save(settings);
    return settings;
  }
}

export async function replaceStatusSettings(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("إعدادات الحالات غير صالحة.");
  const settings = sanitize(input as Partial<StatusSettings>);
  await save(settings);
  return settings;
}

export function matchesStatusSettings(settings: StatusSettings, senderPhone: string) {
  const phone = normalizePhone(senderPhone);
  if (!settings.enabled || !phone || settings.excludePhones.includes(phone)) return false;
  return settings.mode === "all" || settings.includePhones.includes(phone);
}

export function reactionForPhone(settings: StatusSettings, senderPhone: string) {
  return settings.customReactions[normalizePhone(senderPhone)] ?? settings.defaultReaction;
}

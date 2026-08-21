/**
 * Persistent, opt-in settings for status viewing and reactions. Defaults are deliberately off.
 */
import { readDocument, writeDocument } from "./neon-store";

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
  await writeDocument("status-settings", settings);
}

export async function getStatusSettings() {
  const stored = await readDocument<Partial<StatusSettings>>("status-settings");
  if (stored) return sanitize(stored);
  const settings = defaultSettings();
  await save(settings);
  return settings;
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

/**
 * Rule repository backed by Neon in production and a private local fallback in development.
 */
import { readDocument, writeDocument } from "./neon-store";

export type RuleEvent = "message.received";

export type ReplyRule = {
  id: string;
  name: string;
  enabled: boolean;
  event: RuleEvent;
  contains: string;
  targetPhone: string;
  reply: string;
  createdAt: string;
  updatedAt: string;
};


function createDefaultRule(): ReplyRule {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "رد الترحيب",
    enabled: false,
    event: "message.received",
    contains: "مرحبا",
    targetPhone: "",
    reply: "أهلًا بك، وصلت رسالتك وسنرد عليك قريبًا.",
    createdAt: now,
    updatedAt: now,
  };
}

function sanitizeRule(input: Partial<ReplyRule>, existing?: ReplyRule): ReplyRule {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? (typeof input.id === "string" && input.id ? input.id : crypto.randomUUID()),
    name: String(input.name ?? existing?.name ?? "قاعدة رد جديدة").trim().slice(0, 80) || "قاعدة رد جديدة",
    enabled: Boolean(input.enabled),
    event: "message.received",
    contains: String(input.contains ?? existing?.contains ?? "").trim().slice(0, 250),
    targetPhone: String(input.targetPhone ?? existing?.targetPhone ?? "").replace(/[^\d+]/g, "").slice(0, 24),
    reply: String(input.reply ?? existing?.reply ?? "").trim().slice(0, 1500),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

async function readStoredRules(): Promise<ReplyRule[] | null> {
  const data = await readDocument<unknown>("rules");
  if (!Array.isArray(data)) return null;
  return data.filter((item): item is Partial<ReplyRule> => Boolean(item && typeof item === "object")).map((item) => sanitizeRule(item));
}

async function writeRules(rules: ReplyRule[]) {
  await writeDocument("rules", rules);
}

export async function getRules() {
  const stored = await readStoredRules();
  if (stored?.length) return stored;
  const defaults = [createDefaultRule()];
  await writeRules(defaults);
  return defaults;
}

export async function replaceRules(input: unknown) {
  if (!Array.isArray(input)) throw new Error("يجب أن تكون القواعد قائمة صالحة.");
  if (input.length > 50) throw new Error("الحد الأقصى هو 50 قاعدة رد.");
  const previous = await getRules();
  const rules = input.map((item) => {
    const source = item && typeof item === "object" ? item as Partial<ReplyRule> : {};
    const existing = previous.find((rule) => rule.id === source.id);
    const result = sanitizeRule(source, existing);
    if (result.enabled && (!result.contains || !result.reply)) throw new Error("القاعدة المفعّلة تحتاج عبارة تشغيل ونص رد.");
    return result;
  });
  await writeRules(rules);
  return rules;
}

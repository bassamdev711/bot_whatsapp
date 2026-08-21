/**
 * Interactive WhatsApp flows: opt-in numeric menus with short-lived in-memory conversation state.
 */
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export type FlowOption = { id: string; label: string; reply: string };
export type InteractiveFlow = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  targetPhone: string;
  startMessage: string;
  invalidMessage: string;
  options: FlowOption[];
  createdAt: string;
  updatedAt: string;
};

const dataDirectory = path.join(process.cwd(), ".wasla-data");
const flowsPath = path.join(dataDirectory, "interactive-flows.json");
const pendingFlows = new Map<string, { flowId: string; expiresAt: number }>();
const sessionLifetimeMs = 15 * 60 * 1000;

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("ar");
}

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 18);
}

function defaultFlow(): InteractiveFlow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "قائمة الخدمات",
    enabled: false,
    trigger: "خدمات",
    targetPhone: "",
    startMessage: "أهلًا بك. اختر الخدمة التي تريدها بإرسال رقم الخيار:",
    invalidMessage: "لم أفهم اختيارك. أرسل رقمًا من القائمة التالية:",
    options: [
      { id: "1", label: "خدمة الاستعلام", reply: "اخترت خدمة الاستعلام. أرسل تفاصيل طلبك وسنتابع معك." },
      { id: "2", label: "خدمة الدعم", reply: "اخترت خدمة الدعم. اشرح المشكلة وسنساعدك." },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function sanitizeOption(input: Partial<FlowOption>, fallbackId: string): FlowOption {
  const id = String(input.id ?? fallbackId).trim().slice(0, 24) || fallbackId;
  return {
    id,
    label: String(input.label ?? "خدمة جديدة").trim().slice(0, 120) || "خدمة جديدة",
    reply: String(input.reply ?? "").trim().slice(0, 1500),
  };
}

function sanitizeFlow(input: Partial<InteractiveFlow>, existing?: InteractiveFlow): InteractiveFlow {
  const now = new Date().toISOString();
  const rawOptions = Array.isArray(input.options) ? input.options : existing?.options ?? [];
  const options = rawOptions.slice(0, 12).map((option, index) => sanitizeOption(option, String(index + 1)));
  return {
    id: existing?.id ?? (typeof input.id === "string" && input.id ? input.id : crypto.randomUUID()),
    name: String(input.name ?? existing?.name ?? "تدفق جديد").trim().slice(0, 80) || "تدفق جديد",
    enabled: Boolean(input.enabled),
    trigger: String(input.trigger ?? existing?.trigger ?? "").trim().slice(0, 120),
    targetPhone: normalizePhone(input.targetPhone ?? existing?.targetPhone),
    startMessage: String(input.startMessage ?? existing?.startMessage ?? "").trim().slice(0, 1500),
    invalidMessage: String(input.invalidMessage ?? existing?.invalidMessage ?? "لم أفهم اختيارك.").trim().slice(0, 800),
    options,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

async function writeFlows(flows: InteractiveFlow[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${flowsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(flows, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, flowsPath);
}

export async function getFlows() {
  try {
    const raw = JSON.parse(await readFile(flowsPath, "utf8")) as unknown;
    if (!Array.isArray(raw)) throw new Error("ملف التدفقات غير صالح.");
    return raw.filter((item): item is Partial<InteractiveFlow> => Boolean(item && typeof item === "object")).map((item) => sanitizeFlow(item));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const flows = [defaultFlow()];
    await writeFlows(flows);
    return flows;
  }
}

export async function replaceFlows(input: unknown) {
  if (!Array.isArray(input)) throw new Error("يجب أن تكون التدفقات قائمة صالحة.");
  if (input.length > 20) throw new Error("الحد الأقصى هو 20 تدفقًا.");
  const previous = await getFlows();
  const flows = input.map((item) => {
    const source = item && typeof item === "object" ? item as Partial<InteractiveFlow> : {};
    const existing = previous.find((flow) => flow.id === source.id);
    const result = sanitizeFlow(source, existing);
    if (result.enabled && (!result.trigger || !result.startMessage || result.options.length === 0 || result.options.some((option) => !option.reply))) {
      throw new Error("التدفق المفعّل يحتاج كلمة بدء ورسالة قائمة وخيارًا واحدًا مكتملًا على الأقل.");
    }
    return result;
  });
  await writeFlows(flows);
  return flows;
}

function matchesPhone(flow: InteractiveFlow, senderPhone: string) {
  return !flow.targetPhone || flow.targetPhone === senderPhone;
}

function renderMenu(flow: InteractiveFlow, prefix = flow.startMessage) {
  const options = flow.options.map((option) => `${option.id}. ${option.label}`).join("\n");
  return `${prefix}\n\n${options}`;
}

/** Returns true when the inbound text was consumed by a flow. */
export async function applyInteractiveFlows({ socket, message, text, onAction }: { socket: WASocket; message: WAMessage; text: string; onAction: (label: string, detail: string) => void }) {
  const jid = message.key.remoteJid;
  if (!jid || message.key.fromMe) return false;
  const senderPhone = jid.split("@")[0].replace(/\D/g, "");
  const normalizedText = normalizeText(text);
  const flows = await getFlows();
  const pending = pendingFlows.get(jid);

  if (pending) {
    const flow = flows.find((item) => item.id === pending.flowId && item.enabled && matchesPhone(item, senderPhone));
    if (!flow || pending.expiresAt <= Date.now()) {
      pendingFlows.delete(jid);
    } else {
      const option = flow.options.find((item) => normalizedText === normalizeText(item.id) || normalizedText === normalizeText(item.label));
      if (option) {
        await socket.sendMessage(jid, { text: option.reply });
        pendingFlows.delete(jid);
        onAction("تم تنفيذ خيار من القائمة", `اختار المرسل «${option.label}» من تدفق «${flow.name}».`);
      } else {
        await socket.sendMessage(jid, { text: renderMenu(flow, flow.invalidMessage) });
        pendingFlows.set(jid, { flowId: flow.id, expiresAt: Date.now() + sessionLifetimeMs });
        onAction("خيار غير صحيح في القائمة", `أعيد إرسال قائمة «${flow.name}» للمرسل.`);
      }
      return true;
    }
  }

  const flow = flows.find((item) => item.enabled && matchesPhone(item, senderPhone) && normalizedText === normalizeText(item.trigger));
  if (!flow) return false;
  await socket.sendMessage(jid, { text: renderMenu(flow) });
  pendingFlows.set(jid, { flowId: flow.id, expiresAt: Date.now() + sessionLifetimeMs });
  onAction("تم بدء قائمة تفاعلية", `أرسلت قائمة «${flow.name}» إلى ${jid}.`);
  return true;
}

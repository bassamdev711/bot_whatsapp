/**
 * WhatsApp session bridge: an explicit, local-first Baileys connection with QR / pairing-code support.
 * This module must run only in a persistent Node.js process with a writable session directory.
 */
import path from "node:path";
import { rm } from "node:fs/promises";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  useMultiFileAuthState as loadMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { applyAutomationRules } from "@/lib/automation";

export type SessionStatus = "idle" | "connecting" | "awaiting_qr" | "awaiting_pairing" | "connected" | "error";
export type WhatsAppEvent = { id: string; type: string; label: string; detail: string; createdAt: string };

export type PublicSession = {
  status: SessionStatus;
  qrDataUrl: string | null;
  pairingCode: string | null;
  phone: string | null;
  updatedAt: string;
  error: string | null;
  events: WhatsAppEvent[];
};

type BridgeState = PublicSession & { socket: WASocket | null; connecting: Promise<void> | null };

const authDirectory = path.join(process.cwd(), ".wasla-session");
const initialState = (): BridgeState => ({
  status: "idle",
  qrDataUrl: null,
  pairingCode: null,
  phone: null,
  updatedAt: new Date().toISOString(),
  error: null,
  events: [],
  socket: null,
  connecting: null,
});

const globalForWhatsApp = globalThis as unknown as { waslaBridge?: BridgeState };
const state = globalForWhatsApp.waslaBridge ?? initialState();
globalForWhatsApp.waslaBridge = state;

const update = (values: Partial<BridgeState>) => Object.assign(state, values, { updatedAt: new Date().toISOString() });

function logEvent(type: string, label: string, detail: string) {
  state.events = [{ id: crypto.randomUUID(), type, label, detail, createdAt: new Date().toISOString() }, ...state.events].slice(0, 50);
  update({});
}

function plainText(message: Record<string, unknown> | undefined) {
  if (!message) return "رسالة بدون نص";
  if (typeof message.conversation === "string") return message.conversation;
  const extended = message.extendedTextMessage as { text?: string } | undefined;
  if (extended?.text) return extended.text;
  return "رسالة وسائط أو تفاعل";
}

function publicSession(): PublicSession {
  return {
    status: state.status,
    qrDataUrl: state.qrDataUrl,
    pairingCode: state.pairingCode,
    phone: state.phone,
    updatedAt: state.updatedAt,
    error: state.error,
    events: state.events,
  };
}

async function openSocket(phone?: string) {
  const { state: auth, saveCreds } = await loadMultiFileAuthState(authDirectory);
  const { version } = await fetchLatestBaileysVersion();
  const socket = makeWASocket({
    auth,
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
  });

  update({ socket, status: phone ? "awaiting_pairing" : "connecting", phone: phone ?? null, error: null, qrDataUrl: null, pairingCode: null });
  logEvent("session.started", "بدأ ربط الجلسة", phone ? "بانتظار كود ربط الهاتف." : "بانتظار رمز QR من واتساب.");

  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("messages.upsert", ({ messages }) => {
    for (const item of messages) {
      const jid = item.key.remoteJid;
      const isStatus = jid === "status@broadcast";
      const sender = item.pushName || item.key.participant || jid || "رقم غير معروف";
      const text = plainText(item.message as Record<string, unknown> | undefined);
      logEvent(
        isStatus ? "status.received" : "message.received",
        isStatus ? "وصلت حالة" : "وصلت رسالة جديدة",
        isStatus ? `وصلت حالة من ${sender}.` : `${sender}: ${text}`,
      );
      void applyAutomationRules({
        socket,
        message: item,
        text,
        onAction: (label, detail) => logEvent("rule.executed", label, detail),
      }).catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : "فشل تنفيذ إحدى قواعد الأحداث.";
        logEvent("rule.failed", "تعذر تنفيذ القاعدة", detail);
      });
    }
  });

  socket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr, { width: 360, margin: 1, color: { dark: "#184D40", light: "#FFFDF9" } });
      update({ status: "awaiting_qr", qrDataUrl, pairingCode: null, error: null });
      logEvent("session.qr", "رمز QR جاهز", "امسح الرمز من الأجهزة المرتبطة في واتساب.");
    }
    if (connection === "open") {
      update({ status: "connected", qrDataUrl: null, pairingCode: null, error: null });
      logEvent("session.connected", "تم ربط الحساب", "الجلسة متصلة الآن وتستقبل الأحداث.");
    }
    if (connection === "close") {
      const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      update({ socket: null, status: loggedOut ? "idle" : "error", qrDataUrl: null, pairingCode: null, error: loggedOut ? null : "انقطع الاتصال. أنشئ رمز ربط جديدًا للمحاولة مرة أخرى." });
      logEvent("session.closed", loggedOut ? "تم تسجيل الخروج" : "انقطع الاتصال", loggedOut ? "حُذفت الجلسة من واتساب." : "يمكنك إعادة إنشاء رمز الربط.");
    }
  });

  if (phone && !auth.creds.registered) {
    const pairingCode = await socket.requestPairingCode(phone.replace(/\D/g, ""));
    update({ status: "awaiting_pairing", pairingCode, qrDataUrl: null });
    logEvent("session.pairing_code", "تم إنشاء كود الربط", "أدخل الكود في الأجهزة المرتبطة على هاتفك.");
  }
}

export async function beginSession(method: "qr" | "pairing", phone?: string) {
  if (state.status === "connected") return publicSession();
  if (state.connecting) {
    await state.connecting;
    return publicSession();
  }
  if (method === "pairing" && !phone) throw new Error("أدخل رقم الهاتف بصيغة دولية لإنشاء كود الربط.");
  state.connecting = openSocket(method === "pairing" ? phone : undefined).finally(() => { state.connecting = null; });
  await state.connecting;
  return publicSession();
}

export function getSession() {
  return publicSession();
}

export async function closeSession() {
  try { await state.socket?.logout(); } catch { /* Remote session may already be closed. */ }
  try { await rm(authDirectory, { recursive: true, force: true }); } catch { /* No local session exists. */ }
  const retainedEvents = state.events;
  Object.assign(state, initialState(), { events: [{ id: crypto.randomUUID(), type: "session.reset", label: "تمت إعادة ضبط الجلسة", detail: "حُذفت بيانات الربط المحلية.", createdAt: new Date().toISOString() }, ...retainedEvents].slice(0, 50) });
  return publicSession();
}

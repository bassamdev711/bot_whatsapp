/**
 * Explicit event rules for Wasla. Every external action is disabled by default;
 * enable only the rules you own and review the reply text before running in production.
 */
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export type AutomationRule =
  | { id: "reply-welcome"; enabled: boolean; event: "message.received"; contains: string; reply: string }
  | { id: "mark-status-seen"; enabled: boolean; event: "status.received" };

export const automationRules: AutomationRule[] = [
  {
    id: "reply-welcome",
    enabled: false,
    event: "message.received",
    contains: "مرحبا",
    reply: "أهلًا بك، وصلت رسالتك وسنرد عليك قريبًا.",
  },
  {
    id: "mark-status-seen",
    enabled: false,
    event: "status.received",
  },
];

export async function applyAutomationRules({ socket, message, text, onAction }: { socket: WASocket; message: WAMessage; text: string; onAction: (label: string, detail: string) => void }) {
  const jid = message.key.remoteJid;
  const isStatus = jid === "status@broadcast";

  if (isStatus) {
    const statusRule = automationRules.find((rule): rule is Extract<AutomationRule, { id: "mark-status-seen" }> => rule.id === "mark-status-seen");
    if (statusRule?.enabled) {
      await socket.readMessages([message.key]);
      onAction("تم تأكيد مشاهدة الحالة", "نفذت قاعدة مشاهدة الحالة المفعّلة.");
    }
    return;
  }

  if (!jid || message.key.fromMe) return;
  const replyRule = automationRules.find((rule): rule is Extract<AutomationRule, { id: "reply-welcome" }> => rule.id === "reply-welcome");
  if (replyRule?.enabled && text.toLocaleLowerCase("ar").includes(replyRule.contains.toLocaleLowerCase("ar"))) {
    await socket.sendMessage(jid, { text: replyRule.reply });
    onAction("تم إرسال رد تلقائي", `طُبّقت قاعدة الرد على المحادثة ${jid}.`);
  }
}

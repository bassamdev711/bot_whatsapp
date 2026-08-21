/**
 * Runtime rule executor. Reply rules are editable from the dashboard and read from
 * the local repository each time an inbound message arrives.
 */
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { getRules } from "@/lib/rules";

export async function applyAutomationRules({ socket, message, text, onAction }: { socket: WASocket; message: WAMessage; text: string; onAction: (label: string, detail: string) => void }) {
  const jid = message.key.remoteJid;
  const isStatus = jid === "status@broadcast";
  if (!jid || message.key.fromMe) return;
  if (isStatus) return;

  const senderPhone = jid.split("@")[0].replace(/\D/g, "");
  const normalizedText = text.toLocaleLowerCase("ar");
  const rules = await getRules();
  for (const rule of rules) {
    const expectedPhone = rule.targetPhone.replace(/\D/g, "");
    const matchesPhone = !expectedPhone || senderPhone === expectedPhone;
    const matchesText = normalizedText.includes(rule.contains.toLocaleLowerCase("ar"));
    if (rule.enabled && matchesPhone && matchesText) {
      await socket.sendMessage(jid, { text: rule.reply });
      onAction("تم إرسال رد تلقائي", `طُبّقت قاعدة «${rule.name}» على المحادثة ${jid}.`);
    }
  }
}

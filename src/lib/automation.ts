/**
 * Runtime rule executor. Reply rules are editable from the dashboard and read from
 * the local repository each time an inbound message arrives.
 */
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { applyInteractiveFlows } from "@/lib/flows";
import { getRules } from "@/lib/rules";
import { getStatusSettings, matchesStatusSettings, reactionForPhone } from "@/lib/status-settings";

export async function applyAutomationRules({ socket, message, text, onAction }: { socket: WASocket; message: WAMessage; text: string; onAction: (label: string, detail: string) => void }) {
  const jid = message.key.remoteJid;
  const isStatus = jid === "status@broadcast";
  if (!jid || message.key.fromMe) return;

  if (isStatus) {
    const senderJid = message.key.participant ?? "";
    const senderPhone = senderJid.split("@")[0].replace(/\D/g, "");
    const settings = await getStatusSettings();
    if (!matchesStatusSettings(settings, senderPhone)) return;
    if (settings.markSeen) await socket.readMessages([message.key]);
    if (settings.sendReaction) {
      await socket.sendMessage(jid, { react: { text: reactionForPhone(settings, senderPhone), key: message.key } });
    }
    onAction("تمت معالجة حالة جديدة", `${settings.markSeen ? "تم تأكيد المشاهدة" : "لم يُرسل تأكيد مشاهدة"}${settings.sendReaction ? " وإرسال التفاعل المحدد." : "."}`);
    return;
  }

  const senderPhone = jid.split("@")[0].replace(/\D/g, "");
  const normalizedText = text.toLocaleLowerCase("ar");
  if (await applyInteractiveFlows({ socket, message, text, onAction })) return;
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

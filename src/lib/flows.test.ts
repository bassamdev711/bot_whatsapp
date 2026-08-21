import { afterEach, describe, expect, it } from "vitest";
import type { WAMessage, WASocket } from "@whiskeysockets/baileys";
import { applyInteractiveFlows, getFlows, replaceFlows } from "./flows";

const originalFlows = await getFlows();

afterEach(async () => {
  await replaceFlows(originalFlows);
});

describe("interactive service menus", () => {
  it("sends a menu after its trigger then the selected service reply", async () => {
    const flow = {
      ...originalFlows[0],
      enabled: true,
      trigger: "اختبار قائمة",
      targetPhone: "966500000000",
      startMessage: "مرحبًا، اختر خدمة:",
      invalidMessage: "خيار غير صحيح.",
      options: [
        { id: "1", label: "الخدمة الأولى", reply: "تم اختيار الخدمة الأولى." },
        { id: "2", label: "الخدمة الثانية", reply: "تم اختيار الخدمة الثانية." },
      ],
    };
    await replaceFlows([flow]);
    const sent: Array<{ jid: string; content: unknown }> = [];
    const actions: string[] = [];
    const socket = { sendMessage: async (jid: string, content: unknown) => { sent.push({ jid, content }); } } as unknown as WASocket;
    const message = { key: { remoteJid: "966500000000@s.whatsapp.net", fromMe: false } } as WAMessage;

    await expect(applyInteractiveFlows({ socket, message, text: "اختبار قائمة", onAction: (label) => actions.push(label) })).resolves.toBe(true);
    expect(sent[0].content).toMatchObject({ text: expect.stringContaining("1. الخدمة الأولى") });

    await expect(applyInteractiveFlows({ socket, message, text: "1", onAction: (label) => actions.push(label) })).resolves.toBe(true);
    expect(sent[1].content).toEqual({ text: "تم اختيار الخدمة الأولى." });
    expect(actions).toEqual(["تم بدء قائمة تفاعلية", "تم تنفيذ خيار من القائمة"]);
  });
});

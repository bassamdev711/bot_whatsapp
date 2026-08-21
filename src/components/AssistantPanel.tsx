"use client";

/** Design: Golden Protocol — a deliberate personal-assistant surface with explicit enablement and policy control. */
import { useState } from "react";
import { Bot, LockKeyhole, MessageCircle, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import type { AssistantSettings } from "@/lib/assistant-settings";

type ChatMessage = { role: "user" | "model"; text: string };

const strictnessOptions: Array<{ value: AssistantSettings["strictness"]; title: string; detail: string }> = [
  { value: "guided", title: "موجّه", detail: "اقتراحات عملية ضمن نطاق اللوحة." },
  { value: "strict", title: "صارم", detail: "إجابات محددة بلا تخمين أو أتمتة واسعة." },
  { value: "locked", title: "مقفل", detail: "فقط شؤون لوحة وصلة وحالة الحساب." },
];

export function AssistantPanel({ settings, isBusy, error, onSave, onClose }: { settings: AssistantSettings; isBusy: boolean; error: string | null; onSave: (settings: AssistantSettings) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState(settings);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "model", text: "أنا مساعد وصلة الشخصي لبسّام. أساعد في فهم الربط والقواعد والتدفقات، ولا أنفذ أي إجراء بدلًا عنك." }]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const save = async () => {
    await onSave(draft);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    if (!settings.enabled) {
      setChatError("المساعد معطّل. فعّل المفتاح واحفظ الإعدادات قبل بدء المحادثة.");
      return;
    }
    const nextMessages: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setChatError(null);
    setChatBusy(true);
    try {
      const response = await fetch("/api/assistant/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages.slice(1) }) });
      const payload = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.error || "تعذر الحصول على رد من المساعد.");
      setMessages((current) => [...current, { role: "model", text: payload.reply ?? "" }]);
    } catch (requestError) {
      setChatError(requestError instanceof Error ? requestError.message : "تعذر تشغيل المساعد.");
    } finally {
      setChatBusy(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="المساعد الشخصي لبسّام"><div className="flex max-h-[94vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-t-[28px] border border-[#caa45a]/25 bg-[#12110f] shadow-[0_30px_90px_rgba(0,0,0,.62)] sm:max-h-[88vh] sm:rounded-[28px]"><div className="flex items-center justify-between border-b border-[#caa45a]/20 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[#caa45a]/35 bg-[#caa45a]/10 text-[#e0bd6d]"><Bot size={19} /></span><div><p className="text-xs font-bold tracking-[0.08em] text-[#caa45a]">المساعد الشخصي</p><h2 className="mt-0.5 font-display text-xl font-bold tracking-[-0.04em] text-[#f7f0e3]">مساعد بسّام</h2></div></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${settings.enabled ? "bg-[#caa45a]/15 text-[#e0bd6d]" : "bg-white/5 text-[#9c958a]"}`}>{settings.enabled ? "مفعّل" : "معطّل"}</span><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-[#b8b0a2] hover:bg-white/5" aria-label="إغلاق"><X size={19} /></button></div></div><div className="grid min-h-0 flex-1 lg:grid-cols-[0.82fr_1.18fr]"><aside className="min-h-0 overflow-y-auto border-b border-white/[.08] bg-white/[.018] p-5 sm:p-6 lg:border-b-0 lg:border-l"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[#f7f0e3]">التحكم والصرامة</h3><p className="mt-1 text-xs leading-5 text-[#aaa398]">الإعدادات لا تسلّم للمساعد إلا بعد الحفظ.</p></div><button onClick={() => setDraft((current) => ({ ...current, enabled: !current.enabled }))} className={`relative h-7 w-12 rounded-full transition ${draft.enabled ? "bg-[#caa45a]" : "bg-white/10"}`} aria-pressed={draft.enabled} aria-label="تفعيل المساعد"><span className={`absolute top-1 h-5 w-5 rounded-full bg-[#f7f0e3] shadow transition ${draft.enabled ? "left-1" : "left-6"}`} /></button></div><div className="mt-5 space-y-2">{strictnessOptions.map((option) => <button key={option.value} onClick={() => setDraft((current) => ({ ...current, strictness: option.value }))} className={`w-full rounded-xl border p-3 text-right transition ${draft.strictness === option.value ? "border-[#caa45a]/55 bg-[#caa45a]/10" : "border-white/[.08] bg-white/[.02] hover:bg-white/[.05]"}`}><span className="flex items-center justify-between"><strong className="text-xs text-[#f7f0e3]">{option.title}</strong>{draft.strictness === option.value && <Sparkles size={14} className="text-[#e0bd6d]" />}</span><span className="mt-1 block text-[11px] leading-5 text-[#aaa398]">{option.detail}</span></button>)}</div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[.08] bg-white/[.02] p-3"><input type="checkbox" checked={draft.allowActivityContext} onChange={(event) => setDraft((current) => ({ ...current, allowActivityContext: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-[#caa45a]" /><span><strong className="text-xs text-[#f7f0e3]">السماح بقراءة سجل النشاط</strong><span className="mt-1 block text-[11px] leading-5 text-[#aaa398]">يمنح المساعد آخر 15 حدثًا فقط عند التفعيل. يبقى متوقفًا افتراضيًا.</span></span></label><label className="mt-5 block"><span className="flex items-center gap-2 text-xs font-bold text-[#f7f0e3]"><LockKeyhole size={14} className="text-[#e0bd6d]" />تعليمات بسّام الثابتة</span><textarea value={draft.customInstructions} onChange={(event) => setDraft((current) => ({ ...current, customInstructions: event.target.value.slice(0, 4000) }))} className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[.1] bg-black/20 p-3 text-xs leading-6 text-[#e8e1d5] outline-none placeholder:text-[#777168] focus:border-[#caa45a]/60" placeholder="اكتب ما تريد من المساعد الالتزام به..." /></label><button onClick={() => void save()} disabled={isBusy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#caa45a] px-4 py-3 text-xs font-bold text-[#15120d] hover:bg-[#dfbd70] disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={15} />{isBusy ? "جارٍ الحفظ..." : "حفظ إعدادات المساعد"}</button>{error && <p className="mt-3 rounded-xl border border-[#e57e63]/25 bg-[#e57e63]/10 p-3 text-xs leading-5 text-[#f2aa96]">{error}</p>}</aside><section className="flex min-h-0 flex-col p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-[#f7f0e3]">محادثة خاصة</h3><p className="mt-1 text-xs text-[#aaa398]">قراءة وإرشاد فقط؛ لا ينفّذ المساعد أي عملية على واتساب.</p></div><MessageCircle size={18} className="text-[#e0bd6d]" /></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/[.08] bg-black/20 p-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-xs leading-6 ${message.role === "user" ? "mr-auto bg-[#caa45a] text-[#17130d]" : "border border-white/[.08] bg-white/[.045] text-[#e8e1d5]"}`}>{message.text}</div>)}{chatBusy && <div className="w-fit rounded-2xl border border-white/[.08] bg-white/[.045] px-3.5 py-3 text-xs text-[#aaa398]">يفكر المساعد...</div>}</div>{chatError && <p className="mt-3 rounded-xl border border-[#e57e63]/25 bg-[#e57e63]/10 p-3 text-xs leading-5 text-[#f2aa96]">{chatError}</p>}<div className="mt-4 flex gap-2"><textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 3000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} disabled={chatBusy} rows={2} placeholder={settings.enabled ? "اسأل مساعد بسّام عن الربط أو القواعد أو حالة النظام..." : "فعّل المساعد واحفظ الإعدادات لبدء المحادثة."} className="min-h-12 flex-1 resize-none rounded-xl border border-white/[.1] bg-black/20 p-3 text-xs leading-5 text-[#f7f0e3] outline-none placeholder:text-[#777168] focus:border-[#caa45a]/60 disabled:opacity-50" /><button onClick={() => void send()} disabled={chatBusy || !input.trim()} className="grid h-12 w-12 place-items-center self-end rounded-xl bg-[#caa45a] text-[#15120d] hover:bg-[#dfbd70] disabled:cursor-not-allowed disabled:opacity-50" aria-label="إرسال الرسالة"><Send size={17} /></button></div></section></div></div></div>;
}

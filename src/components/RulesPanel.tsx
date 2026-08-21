"use client";

/** Design: Quiet Connection Lab — a focused RTL rule editor for explicit, readable automation. */
import { useState } from "react";
import { Check, MessageCircle, Phone, Plus, Trash2, X, Zap } from "lucide-react";

export type ReplyRule = {
  id: string;
  name: string;
  enabled: boolean;
  event: "message.received";
  contains: string;
  targetPhone: string;
  reply: string;
  createdAt: string;
  updatedAt: string;
};

function blankRule(): ReplyRule {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: "رد جديد", enabled: false, event: "message.received", contains: "", targetPhone: "", reply: "", createdAt: now, updatedAt: now };
}

export function RulesPanel({ rules, isBusy, error, onSave, onClose }: { rules: ReplyRule[]; isBusy: boolean; error: string | null; onSave: (rules: ReplyRule[]) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<ReplyRule>(() => rules[0] ?? blankRule());

  const chooseRule = (rule: ReplyRule) => { setDraft(rule); };
  const createRule = () => { setDraft(blankRule()); };
  const saveDraft = () => {
    const exists = rules.some((rule) => rule.id === draft.id);
    onSave(exists ? rules.map((rule) => rule.id === draft.id ? { ...draft, updatedAt: new Date().toISOString() } : rule) : [...rules, { ...draft, updatedAt: new Date().toISOString() }]);
  };
  const removeDraft = () => {
    if (rules.length < 2) return;
    const remaining = rules.filter((rule) => rule.id !== draft.id);
    onSave(remaining);
    setDraft(remaining[0]);
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102e25]/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="إعداد قواعد الرد"><div className="w-full max-w-[970px] overflow-hidden rounded-t-[28px] border border-white/50 bg-[#fbfaf6] shadow-[0_30px_90px_rgba(18,51,42,0.28)] sm:rounded-[28px]"><div className="flex items-center justify-between border-b border-[#e1e3dc] px-5 py-4 sm:px-7"><div><p className="text-xs font-bold tracking-[0.08em] text-[#6f897e]">قواعد الأحداث</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-0.04em] text-[#1c4337]">اضبط الردود كما تريد</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-[#62796f] hover:bg-[#eff1eb]" aria-label="إغلاق"><X size={19} /></button></div><div className="grid max-h-[78vh] overflow-y-auto lg:grid-cols-[250px_1fr]"><aside className="border-b border-[#e1e3dc] bg-[#f2f4ee] p-4 lg:border-b-0 lg:border-l lg:p-5"><div className="flex items-center justify-between"><p className="text-sm font-bold text-[#315347]">قواعدك</p><button onClick={createRule} className="grid h-8 w-8 place-items-center rounded-lg bg-[#dceee4] text-[#0e8065] hover:bg-[#cae5d7]" aria-label="قاعدة جديدة"><Plus size={16} /></button></div><div className="mt-4 space-y-2">{rules.map((rule) => <button key={rule.id} onClick={() => chooseRule(rule)} className={`w-full rounded-xl p-3 text-right transition ${draft.id === rule.id ? "bg-[#fbfaf6] shadow-sm" : "hover:bg-white/65"}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold text-[#315347]">{rule.name}</span><span className={`h-2 w-2 shrink-0 rounded-full ${rule.enabled ? "bg-[#0e8065]" : "bg-[#d5ad4f]"}`} /></div><p className="mt-1 truncate text-[11px] text-[#778b80]">{rule.targetPhone || "كل الأرقام"}</p></button>)}</div><div className="mt-5 rounded-xl border border-[#d4e2d9] bg-[#edf7f0] p-3 text-[11px] leading-5 text-[#39705e]"><Zap size={14} className="mb-1" />لن يعمل أي رد قبل ربط حساب واتساب وتفعيل القاعدة.</div></aside><div className="p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2f1e9] text-[#0e8065]"><MessageCircle size={17} /></span><div><p className="text-sm font-bold text-[#315347]">رد على رسالة واردة</p><p className="text-xs text-[#778b80]">يُنفَّذ بعد تحقق العبارة والرقم، إن حُدد.</p></div></div><button onClick={() => setDraft({ ...draft, enabled: !draft.enabled })} className={`relative h-7 w-12 rounded-full p-1 transition ${draft.enabled ? "bg-[#0e8065]" : "bg-[#c7cec9]"}`} aria-label="تفعيل القاعدة"><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition ${draft.enabled ? "translate-x-0" : "-translate-x-5"}`} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-[#315347]">اسم القاعدة<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d7dfd8] bg-white px-3 text-sm font-normal outline-none focus:border-[#0e8065] focus:ring-4 focus:ring-[#0e8065]/10" placeholder="مثال: رد العملاء" /></label><label className="block text-sm font-bold text-[#315347]">العبارة التي تبدأ الرد<input value={draft.contains} onChange={(event) => setDraft({ ...draft, contains: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d7dfd8] bg-white px-3 text-sm font-normal outline-none focus:border-[#0e8065] focus:ring-4 focus:ring-[#0e8065]/10" placeholder="مثال: مرحبا" /></label></div><label className="mt-5 block text-sm font-bold text-[#315347]"><span className="flex items-center gap-2"><Phone size={15} className="text-[#0e8065]" />رد خاص لرقم محدد <span className="font-normal text-[#82948b]">(اختياري)</span></span><input value={draft.targetPhone} onChange={(event) => setDraft({ ...draft, targetPhone: event.target.value })} dir="ltr" className="mt-2 h-11 w-full rounded-xl border border-[#d7dfd8] bg-white px-3 text-left text-sm font-normal outline-none placeholder:text-[#a5b0aa] focus:border-[#0e8065] focus:ring-4 focus:ring-[#0e8065]/10" placeholder="+9665XXXXXXXX" /><span className="mt-2 block text-xs font-normal leading-5 text-[#778b80]">اتركه فارغًا ليعمل الرد مع أي شخص. عند إدخاله، لا يرد النظام إلا على هذا الرقم.</span></label><label className="mt-5 block text-sm font-bold text-[#315347]">نص الرد<textarea value={draft.reply} onChange={(event) => setDraft({ ...draft, reply: event.target.value })} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#d7dfd8] bg-white p-3 text-sm font-normal leading-6 outline-none placeholder:text-[#a5b0aa] focus:border-[#0e8065] focus:ring-4 focus:ring-[#0e8065]/10" placeholder="اكتب الرد الذي تريد إرساله هنا..." /></label>{error && <p className="mt-4 rounded-xl bg-[#fff0ec] p-3 text-xs leading-5 text-[#a44b33]">{error}</p>}<div className="mt-6 flex items-center justify-between border-t border-[#e6e8e2] pt-5"><button onClick={removeDraft} disabled={rules.length < 2 || isBusy} className="text-xs font-bold text-[#b2543a] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} className="ml-1 inline" />حذف القاعدة</button><div className="flex items-center gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#647c71] hover:bg-[#eff1eb]">إلغاء</button><button onClick={saveDraft} disabled={isBusy || !draft.contains.trim() || !draft.reply.trim()} className="flex items-center gap-2 rounded-xl bg-[#0e8065] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_16px_rgba(14,128,101,0.16)] disabled:cursor-not-allowed disabled:opacity-55">{isBusy ? "جارٍ الحفظ..." : "حفظ القاعدة"}<Check size={15} /></button></div></div></div></div></div></div>;
}

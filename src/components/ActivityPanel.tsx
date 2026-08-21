"use client";

/** Design: Golden Protocol — a readable operational audit trail, with data instead of decorative placeholders. */
import { BellRing, Bot, Link2, MessageCircle, Radio, Trash2, X } from "lucide-react";

export type ActivityEvent = { id: string; type: string; label: string; detail: string; createdAt: string };

function iconFor(type: string) {
  if (type.startsWith("session")) return Link2;
  if (type.startsWith("message")) return MessageCircle;
  if (type.startsWith("rule")) return Bot;
  return Radio;
}

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "الآن";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "الآن";
  if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} د`;
  if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} س`;
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(new Date(timestamp));
}

export function ActivityPanel({ events, isBusy, error, onClear, onClose }: { events: ActivityEvent[]; isBusy: boolean; error: string | null; onClear: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="سجل النشاط"><div className="w-full max-w-[820px] overflow-hidden rounded-t-[28px] border border-white/15 bg-[#12110f] shadow-[0_30px_90px_rgba(0,0,0,.55)] sm:rounded-[28px]"><div className="flex items-center justify-between border-b border-[#caa45a]/20 px-5 py-4 sm:px-7"><div><p className="text-xs font-bold tracking-[0.08em] text-[#caa45a]">السجل التشغيلي</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-0.04em] text-[#f7f0e3]">كل ما حدث في حسابك</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-[#b8b0a2] hover:bg-white/5" aria-label="إغلاق"><X size={19} /></button></div><div className="max-h-[72vh] overflow-y-auto p-5 sm:p-7">{events.length > 0 ? <div className="space-y-2">{events.map((event) => { const Icon = iconFor(event.type); return <article key={event.id} className="flex gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#caa45a]/25 bg-[#caa45a]/10 text-[#e0bd6d]"><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-[#f7f0e3]">{event.label}</p><time className="shrink-0 font-mono text-[10px] text-[#9c958a]">{formatDate(event.createdAt)}</time></div><p className="mt-1 text-xs leading-5 text-[#b8b0a2]">{event.detail}</p></div></article>; })}</div> : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#caa45a]/30 bg-[#caa45a]/[.035] p-7 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#caa45a]/30 bg-[#caa45a]/10 text-[#e0bd6d]"><BellRing size={20} /></span><h3 className="mt-4 text-sm font-bold text-[#f7f0e3]">لا يوجد نشاط مسجل بعد</h3><p className="mt-2 max-w-sm text-xs leading-6 text-[#aaa398]">سيظهر هنا ربط الحساب والرسائل الواردة وتنفيذ الردود وتفاعلات الحالات بعد أن تبدأ الجلسة.</p></div></div>}{error && <p className="mt-4 rounded-xl border border-[#e57e63]/25 bg-[#e57e63]/10 p-3 text-xs leading-5 text-[#f2aa96]">{error}</p>}<div className="mt-6 flex items-center justify-between border-t border-white/[.08] pt-5"><button onClick={onClear} disabled={isBusy || events.length === 0} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#e5a18e] hover:bg-[#e57e63]/10 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} />{isBusy ? "جارٍ المسح..." : "مسح السجل"}</button><button onClick={onClose} className="rounded-xl bg-[#caa45a] px-4 py-2.5 text-xs font-bold text-[#15120d] hover:bg-[#dfbd70]">تم</button></div></div></div></div>;
}

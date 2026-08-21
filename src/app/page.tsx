"use client";

/**
 * Design: "Quiet Connection Lab" — a warm editorial Arabic dashboard that makes
 * the operational path visible: connect a session, choose event rules, observe activity.
 */
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { FlowPanel, type InteractiveFlow } from "@/components/FlowPanel";
import { RulesPanel } from "@/components/RulesPanel";
import { StatusPanel, type StatusSettings } from "@/components/StatusPanel";
import {
  Activity,
  ArrowLeft,
  BellRing,
  Bolt,
  ChevronLeft,
  CircleCheck,
  Clock3,
  Eye,
  Hash,
  ImageIcon,
  LayoutDashboard,
  Link2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  ScrollText,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

const assets = {
  logo: "/manus-storage/wasla-logo_60ec8cb8.png",
  connection: "/manus-storage/wasla-connection-art_a9953ba8.jpg",
  rules: "/manus-storage/wasla-rules-art_7629197e.jpg",
};

const navItems = [
  { label: "نظرة عامة", icon: LayoutDashboard },
  { label: "الربط", icon: Link2 },
  { label: "قواعد الأحداث", icon: Zap },
  { label: "التدفقات التفاعلية", icon: MessageCircle },
  { label: "إدارة الحالات", icon: Eye },
  { label: "سجل النشاط", icon: ScrollText },
  { label: "الإعدادات", icon: Settings2 },
];

const eventRows = [
  { icon: MessageCircle, title: "وصلت رسالة جديدة", detail: "قاعدة الرد التلقائي في وضع الاستعداد", time: "منذ دقيقتين", tone: "emerald" },
  { icon: Eye, title: "حدث مشاهدة حالة", detail: "سيظهر هنا بعد تفعيل الرابط", time: "بانتظار الحدث", tone: "sky" },
  { icon: ImageIcon, title: "استلام وسائط", detail: "احفظ الوسائط أو مرّرها إلى قاعدة", time: "جاهز", tone: "sand" },
];

type SessionSnapshot = {
  status: "idle" | "connecting" | "awaiting_qr" | "awaiting_pairing" | "connected" | "error";
  qrDataUrl: string | null;
  pairingCode: string | null;
  error: string | null;
};

type ReplyRule = {
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

const emptySession: SessionSnapshot = { status: "idle", qrDataUrl: null, pairingCode: null, error: null };
const emptyStatusSettings: StatusSettings = { enabled: false, markSeen: true, sendReaction: true, defaultReaction: "❤️", mode: "all", includePhones: [], excludePhones: [], customReactions: {}, updatedAt: "" };

const qrCells = Array.from({ length: 169 }, (_, index) => {
  const row = Math.floor(index / 13);
  const column = index % 13;
  const finder = (row < 4 && column < 4) || (row < 4 && column > 8) || (row > 8 && column < 4);
  return finder || (row * 5 + column * 3 + row * column) % 7 < 3;
});

export default function Home() {
  const [activeNav, setActiveNav] = useState("نظرة عامة");
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkMethod, setLinkMethod] = useState<"qr" | "code">("qr");
  const [mobileNav, setMobileNav] = useState(false);
  const [session, setSession] = useState<SessionSnapshot>(emptySession);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [rules, setRules] = useState<ReplyRule[]>([]);
  const [showRulePanel, setShowRulePanel] = useState(false);
  const [rulesBusy, setRulesBusy] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [statusSettings, setStatusSettings] = useState<StatusSettings>(emptyStatusSettings);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [flows, setFlows] = useState<InteractiveFlow[]>([]);
  const [showFlowPanel, setShowFlowPanel] = useState(false);
  const [flowsBusy, setFlowsBusy] = useState(false);
  const [flowsError, setFlowsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/whatsapp/session", { cache: "no-store" });
        if (response.ok && active) setSession(await response.json() as SessionSnapshot);
      } catch { /* The dashboard remains usable while the local bridge is offline. */ }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 3500);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    const loadRules = async () => {
      try {
        const response = await fetch("/api/rules", { cache: "no-store" });
        if (response.ok && active) setRules(await response.json() as ReplyRule[]);
      } catch {
        if (active) setRulesError("تعذر تحميل قواعد الرد. تأكد من استمرار تطبيق Next.js في العمل.");
      }
    };
    void loadRules();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadStatusSettings = async () => {
      try {
        const response = await fetch("/api/status-settings", { cache: "no-store" });
        if (response.ok && active) setStatusSettings(await response.json() as StatusSettings);
      } catch {
        if (active) setStatusError("تعذر تحميل إعدادات الحالات.");
      }
    };
    void loadStatusSettings();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadFlows = async () => {
      try {
        const response = await fetch("/api/flows", { cache: "no-store" });
        if (response.ok && active) setFlows(await response.json() as InteractiveFlow[]);
      } catch {
        if (active) setFlowsError("تعذر تحميل التدفقات التفاعلية.");
      }
    };
    void loadFlows();
    return () => { active = false; };
  }, []);

  const startLink = async (method: "qr" | "pairing", phone?: string) => {
    setConnectionBusy(true);
    setConnectionError(null);
    try {
      const response = await fetch("/api/whatsapp/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, phone }) });
      const payload = await response.json() as SessionSnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error || "تعذر بدء جلسة الربط.");
      setSession(payload);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "تعذر بدء جلسة الربط.");
    } finally {
      setConnectionBusy(false);
    }
  };

  const openQrLink = () => {
    setLinkMethod("qr");
    setShowLinkPanel(true);
    void startLink("qr");
  };

  const persistRules = async (nextRules: ReplyRule[]) => {
    setRulesBusy(true);
    setRulesError(null);
    try {
      const response = await fetch("/api/rules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules: nextRules }) });
      const payload = await response.json() as ReplyRule[] | { error?: string };
      if (!response.ok || !Array.isArray(payload)) throw new Error("error" in payload ? payload.error : "تعذر حفظ القواعد.");
      setRules(payload);
    } catch (error) {
      setRulesError(error instanceof Error ? error.message : "تعذر حفظ القواعد.");
    } finally {
      setRulesBusy(false);
    }
  };

  const selectNav = (label: string) => {
    setActiveNav(label);
    if (label === "قواعد الأحداث") setShowRulePanel(true);
    if (label === "التدفقات التفاعلية") setShowFlowPanel(true);
    if (label === "إدارة الحالات") setShowStatusPanel(true);
  };

  const persistFlows = async (nextFlows: InteractiveFlow[]) => {
    setFlowsBusy(true);
    setFlowsError(null);
    try {
      const response = await fetch("/api/flows", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flows: nextFlows }) });
      const payload = await response.json() as InteractiveFlow[] | { error?: string };
      if (!response.ok || !Array.isArray(payload)) throw new Error("error" in payload ? payload.error : "تعذر حفظ التدفقات.");
      setFlows(payload);
    } catch (error) {
      setFlowsError(error instanceof Error ? error.message : "تعذر حفظ التدفقات.");
    } finally {
      setFlowsBusy(false);
    }
  };

  const persistStatusSettings = async (nextSettings: StatusSettings) => {
    setStatusBusy(true);
    setStatusError(null);
    try {
      const response = await fetch("/api/status-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextSettings) });
      const payload = await response.json() as StatusSettings & { error?: string };
      if (!response.ok) throw new Error(payload.error || "تعذر حفظ إعدادات الحالات.");
      setStatusSettings(payload);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "تعذر حفظ إعدادات الحالات.");
    } finally {
      setStatusBusy(false);
    }
  };

  const primaryRule = rules[0];
  const enabledRules = rules.filter((rule) => rule.enabled).length;

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-[#15362f]" dir="rtl">
      <aside className="fixed right-0 top-0 z-30 hidden h-screen w-[248px] flex-col border-l border-[#d9ddd3] bg-[#fbfaf6] px-4 py-5 lg:flex">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="grid h-11 w-11 place-items-center rounded-[15px] bg-[#e3f0e9] p-2.5 shadow-[0_9px_24px_rgba(14,128,101,0.14)]">
            <img src={assets.logo} alt="رمز وصلة" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-display text-[21px] font-bold tracking-[-0.04em] text-[#134a3d]">وصلة</p>
            <p className="mt-0.5 text-[11px] font-medium tracking-[0.08em] text-[#7d8c83]">إدارة أحداث واتساب</p>
          </div>
        </div>

        <nav className="space-y-1" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.label;
            return (
              <button key={item.label} onClick={() => selectNav(item.label)} className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-right text-sm font-semibold transition-all duration-200 ${isActive ? "bg-[#e4f1e9] text-[#0e8065] shadow-[inset_0_0_0_1px_rgba(14,128,101,0.08)]" : "text-[#67776e] hover:bg-[#f1f3ed] hover:text-[#234f43]"}`}>
                <span className="flex items-center gap-3"><Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />{item.label}</span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#0e8065]" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto overflow-hidden rounded-2xl bg-[#0f3f34] p-4 text-[#f4f3ee]">
          <div className="mb-5 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><ShieldCheck size={17} /></span><span className="rounded-full bg-[#a6dfc7]/15 px-2 py-1 text-[10px] font-bold text-[#b5ead5]">خاص</span></div>
          <p className="text-sm font-bold">خصوصية الرابط</p>
          <p className="mt-1.5 text-xs leading-5 text-[#c9dbd2]">بيانات الجلسة تُحفظ في موصل آمن ولا تظهر في واجهة الحساب.</p>
          <button className="mt-4 flex items-center gap-1 text-xs font-bold text-[#bce8d6] transition hover:gap-2">راجع الحماية <ChevronLeft size={14} /></button>
        </div>
      </aside>

      <main className="lg:mr-[248px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#d9ddd3]/90 bg-[#f3f2ed]/85 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(!mobileNav)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9ddd3] bg-[#fbfaf6] text-[#31584c] lg:hidden" aria-label="فتح التنقل"><Menu size={19} /></button>
            <div><div className="flex items-center gap-2 text-xs text-[#8b988f]"><span>العمل</span><ChevronLeft size={13} /><span className="text-[#49665b]">{activeNav}</span></div><h1 className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-[#193f35]">صباح الخير، بسّام</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#d6e4db] bg-[#eff7f2] px-3 py-2 sm:flex"><Radio className="text-[#0e8065]" size={15} /><span className="text-xs font-bold text-[#277059]">نظام الأحداث جاهز</span></div>
            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#d9ddd3] bg-[#fbfaf6] text-[#456459] transition hover:-translate-y-0.5 hover:shadow-sm" aria-label="التنبيهات"><BellRing size={18} /><span className="absolute left-2 top-2 h-2 w-2 rounded-full border-2 border-[#fbfaf6] bg-[#e57755]" /></button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dcece4] text-sm font-bold text-[#0e8065]">ب</div>
          </div>
        </header>

        {mobileNav && <div className="fixed inset-x-4 top-[86px] z-40 rounded-2xl border border-[#d9ddd3] bg-[#fbfaf6] p-2 shadow-2xl lg:hidden">{navItems.map((item) => { const Icon = item.icon; return <button key={item.label} onClick={() => { selectNav(item.label); setMobileNav(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#49665b] hover:bg-[#eff7f2]"><Icon size={17} />{item.label}</button>; })}</div>}

        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <section className="relative overflow-hidden rounded-[28px] border border-[#d6dfd8] bg-[#edf5ef] p-6 shadow-[0_20px_55px_rgba(46,83,67,0.08)] sm:p-8 lg:min-h-[298px] lg:p-10">
            <img src={assets.connection} alt="مسارات اتصال مجردة" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-left opacity-[0.46] mix-blend-multiply" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(237,245,239,0.14)_0%,rgba(237,245,239,0.78)_48%,rgba(237,245,239,0.98)_76%)]" />
            <div className="relative z-10 max-w-xl">
              <div className="mb-5 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f9f8f3] text-[11px] font-bold text-[#0e8065] shadow-sm">1</span><span className="text-xs font-bold tracking-[0.08em] text-[#5d796d]">ابدأ من الاتصال</span></div>
              <h2 className="font-display text-3xl font-bold leading-[1.2] tracking-[-0.055em] text-[#153e33] sm:text-[38px]">اربط واتساب، ثم اترك <span className="text-[#0e8065]">الأحداث</span> تصل في وقتها.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#547066]">أنشئ جلسة جديدة عبر الرمز أو كود الربط، ثم فعّل القواعد التي تريدها للرسائل والحالات والوسائط.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3"><button onClick={openQrLink} className="flex h-11 items-center gap-2 rounded-xl bg-[#0e8065] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(14,128,101,0.2)] transition hover:bg-[#096a54] active:scale-[0.97]"><QrCode size={18} />ربط حساب واتساب</button><button onClick={() => setShowFlowPanel(true)} className="flex h-11 items-center gap-1.5 rounded-xl border border-[#b9d9cc] bg-white/60 px-3 text-sm font-bold text-[#245846] transition hover:bg-white">أنشئ قائمة خدمات <MessageCircle size={16} /></button><button onClick={() => setShowStatusPanel(true)} className="flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-[#245846] transition hover:bg-white/60">الحالات <Eye size={16} /></button></div>
            </div>
            <div className="relative z-10 mt-7 flex max-w-md items-center gap-3 rounded-2xl border border-white/70 bg-[#fafbf7]/75 p-3.5 backdrop-blur-sm lg:absolute lg:bottom-8 lg:left-9 lg:mt-0"><span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d9efe3] text-[#0e8065]"><Link2 size={20} /><span className="absolute inset-[-4px] rounded-full border border-[#0e8065]/25" /></span><div><p className="text-sm font-bold text-[#26493e]">{session.status === "connected" ? "جلسة واتساب متصلة" : session.status === "awaiting_qr" ? "الرمز جاهز للمسح" : "لا توجد جلسة متصلة"}</p><p className="mt-0.5 text-xs text-[#6b857a]">{session.status === "connected" ? "تصل الأحداث الآن إلى سجل نشاطك." : "ابدأ بالمسح من تطبيق واتساب على هاتفك."}</p></div><span className={`mr-auto h-2.5 w-2.5 rounded-full ${session.status === "connected" ? "bg-[#0e8065]" : "bg-[#d5ad4f]"}`} aria-label="حالة الربط" /></div>
          </section>

          <section className="relative z-10 -mt-3 mb-7 overflow-hidden rounded-2xl border border-[#d4e2d9] bg-[#fbfaf6] px-4 py-4 shadow-[0_12px_30px_rgba(42,78,62,0.06)] sm:px-6">
            <div className="absolute right-[11%] left-[11%] top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-l from-[#0e8065]/45 via-[#79adbd]/35 to-[#d5ad4f]/45 md:block" />
            <div className="relative grid gap-3 md:grid-cols-3 md:gap-8">
              <WorkflowStage number="01" title="الاتصال" detail="اربط الهاتف مرة واحدة" state="الخطوة الحالية" tone="emerald" logo />
              <WorkflowStage number="02" title="الأحداث" detail="تصل الرسائل والحالات" state="جاهز للمراقبة" tone="sky" />
              <WorkflowStage number="03" title="القواعد" detail="نفّذ الإجراء المحدد" state="بعد تأكيدك" tone="sand" />
            </div>
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[1.42fr_0.85fr]">
            <div className="rounded-[24px] border border-[#dde0d9] bg-[#fbfaf6] p-5 shadow-[0_12px_34px_rgba(51,71,60,0.045)] sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-[#6f897e]"><Activity size={15} className="text-[#0e8065]" /> تدفق الأحداث</p><h3 className="font-display text-xl font-bold tracking-[-0.04em] text-[#1d4237]">آخر ما وصل إلى نظامك</h3></div><button className="grid h-9 w-9 place-items-center rounded-xl text-[#799087] transition hover:bg-[#f0f2ec]" aria-label="خيارات السجل"><MoreHorizontal size={19} /></button></div>
              <div className="relative space-y-1 before:absolute before:right-[22px] before:top-7 before:h-[calc(100%-56px)] before:w-px before:bg-[#d5e5dc]">{eventRows.map((event) => { const Icon = event.icon; const colors = event.tone === "emerald" ? "bg-[#e1f0e8] text-[#0e8065]" : event.tone === "sky" ? "bg-[#e5f2f5] text-[#438090]" : "bg-[#f6efdc] text-[#ad8740]"; return <div key={event.title} className="relative flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#f6f7f2]"><span className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl ${colors}`}><Icon size={19} /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#294d41]">{event.title}</p><p className="mt-1 truncate text-xs text-[#73877e]">{event.detail}</p></div><span className="font-mono text-[10px] text-[#98a69e]">{event.time}</span></div>; })}</div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbdad0] py-3 text-xs font-bold text-[#39705e] transition hover:border-[#0e8065] hover:bg-[#eff7f2]">افتح سجل الأحداث <ArrowLeft size={15} /></button>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-[#dde0d9] bg-[#f8f8f3] p-5 shadow-[0_12px_34px_rgba(51,71,60,0.045)] sm:p-6">
              <img src={assets.rules} alt="مسار قاعدة أحداث مجرد" className="pointer-events-none absolute bottom-0 left-0 h-[62%] w-[55%] object-cover opacity-20 mix-blend-multiply" />
              <div className="relative z-10 flex items-start justify-between gap-3"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-[#6f897e]"><Bolt size={15} className="text-[#0e8065]" /> القواعد</p><h3 className="font-display text-xl font-bold tracking-[-0.04em] text-[#1d4237]">ردودك المخصصة</h3></div><button onClick={() => setShowRulePanel(true)} className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2f1e9] text-[#0e8065] transition hover:bg-[#d3ebdf]" aria-label="ضبط قواعد الرد"><SlidersHorizontal size={17} /></button></div>
              <div className="relative z-10 mt-7 space-y-3">{primaryRule ? <button onClick={() => setShowRulePanel(true)} className="w-full rounded-2xl border border-[#d8e8df] bg-[#fdfdf9]/95 p-4 text-right transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center justify-between"><span className="rounded-lg bg-[#e2f1e9] p-2 text-[#0e8065]"><MessageCircle size={17} /></span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${primaryRule.enabled ? "bg-[#e2f1e9] text-[#0e8065]" : "bg-[#f3ede0] text-[#a37b2e]"}`}>{primaryRule.enabled ? "مفعّلة" : "متوقفة"}</span></div><p className="mt-3 text-sm font-bold text-[#315347]">{primaryRule.name}</p><p className="mt-1 text-xs leading-5 text-[#74877e]">{primaryRule.targetPhone ? `رد خاص للرقم ${primaryRule.targetPhone}` : `عند ورود: «${primaryRule.contains || "أي عبارة"}»`}</p></button> : <div className="rounded-2xl border border-dashed border-[#c5d8cc] p-4 text-center text-xs text-[#71857b]">يتم تحميل قواعدك...</div>}<button onClick={() => setShowRulePanel(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#b8d3c5] bg-white/65 p-3.5 text-right text-sm font-bold text-[#39705e] transition hover:bg-[#eff7f2]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e2f1e9]"><Plus size={17} /></span>أنشئ ردًا جديدًا</button></div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-3"><MetricCard icon={Zap} label="قواعد مفعّلة" value={String(enabledRules).padStart(2, "0")} hint={enabledRules ? "تعمل عند وصول الحدث" : "افتح القواعد لتفعيل رد"} shade="emerald" /><MetricCard icon={Clock3} label="وقت الاستجابة" value="—" hint="يظهر بعد أول حدث" shade="sky" /><MetricCard icon={CircleCheck} label="جلسات متصلة" value={session.status === "connected" ? "01" : "00"} hint={session.status === "connected" ? "الجلسة تستقبل الأحداث" : "اربط أول حساب للبدء"} shade="sand" /></section>
          <section className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#d9ded6] bg-[#e9ebe4] px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d8e9df] text-[#0e8065]"><Sparkles size={17} /></span><p className="text-sm text-[#526c61]"><strong className="text-[#284a3e]">ملاحظة تشغيلية:</strong> تظل القواعد في الانتظار إلى أن تُنشأ جلسة ربط صالحة.</p></div><button className="flex items-center gap-1 text-xs font-bold text-[#39705e] hover:text-[#0e8065]">دليل الربط الآمن <ArrowLeft size={14} /></button></section>
        </div>
      </main>

      {showLinkPanel && <LinkPanel linkMethod={linkMethod} setLinkMethod={setLinkMethod} session={session} isBusy={connectionBusy} error={connectionError} onStartQr={() => void startLink("qr")} onStartPairing={(phone) => void startLink("pairing", phone)} onClose={() => setShowLinkPanel(false)} />}
      {showRulePanel && <RulesPanel rules={rules} isBusy={rulesBusy} error={rulesError} onSave={(nextRules) => void persistRules(nextRules)} onClose={() => setShowRulePanel(false)} />}
      {showStatusPanel && <StatusPanel settings={statusSettings} isBusy={statusBusy} error={statusError} onSave={(nextSettings) => void persistStatusSettings(nextSettings)} onClose={() => setShowStatusPanel(false)} />}
      {showFlowPanel && <FlowPanel flows={flows} isBusy={flowsBusy} error={flowsError} onSave={(nextFlows) => void persistFlows(nextFlows)} onClose={() => setShowFlowPanel(false)} />}
    </div>
  );
}

function LinkPanel({ linkMethod, setLinkMethod, session, isBusy, error, onStartQr, onStartPairing, onClose }: { linkMethod: "qr" | "code"; setLinkMethod: (method: "qr" | "code") => void; session: SessionSnapshot; isBusy: boolean; error: string | null; onStartQr: () => void; onStartPairing: (phone: string) => void; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const qrReady = session.status === "awaiting_qr" && session.qrDataUrl;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102e25]/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="ربط حساب واتساب"><div className="w-full max-w-[840px] overflow-hidden rounded-t-[28px] border border-white/50 bg-[#fbfaf6] shadow-[0_30px_90px_rgba(18,51,42,0.28)] sm:rounded-[28px]"><div className="flex items-center justify-between border-b border-[#e1e3dc] px-5 py-4 sm:px-7"><div><p className="text-xs font-bold tracking-[0.08em] text-[#6f897e]">إعداد الجلسة</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-0.04em] text-[#1c4337]">اربط حساب واتساب</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-[#62796f] hover:bg-[#eff1eb]" aria-label="إغلاق"><X size={19} /></button></div><div className="grid lg:grid-cols-[0.95fr_1.05fr]"><div className="border-b border-[#e1e3dc] bg-[#f2f4ee] p-6 lg:border-b-0 lg:border-l lg:p-7"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#dceee4] text-[#0e8065]"><Hash size={15} /></span><p className="text-sm font-bold text-[#315347]">خطوات سريعة</p></div><ol className="mt-5 space-y-5">{["افتح واتساب على هاتفك.", "انتقل إلى الأجهزة المرتبطة من الإعدادات.", "امسح الرمز المعروض هنا أو أدخل كود الربط."].map((step, index) => <li key={step} className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#b9d5c6] bg-[#fbfaf6] font-mono text-[10px] font-bold text-[#0e8065]">{index + 1}</span><span className="pt-0.5 text-sm leading-6 text-[#60786d]">{step}</span></li>)}</ol><div className="mt-8 flex gap-2 rounded-xl border border-[#d6e7dd] bg-[#edf7f0] p-3 text-xs leading-5 text-[#39705e]"><ShieldCheck size={17} className="mt-0.5 shrink-0" />استخدم هاتفك فقط لمسح الرمز. لا تشارك بيانات الجلسة مع أي شخص.</div></div><div className="p-6 sm:p-7"><div className="flex rounded-xl bg-[#eef0eb] p-1"><button onClick={() => setLinkMethod("qr")} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${linkMethod === "qr" ? "bg-[#fbfaf6] text-[#0e8065] shadow-sm" : "text-[#70867b]"}`}>رمز QR</button><button onClick={() => setLinkMethod("code")} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${linkMethod === "code" ? "bg-[#fbfaf6] text-[#0e8065] shadow-sm" : "text-[#70867b]"}`}>كود الربط</button></div>{linkMethod === "qr" ? <div className="mt-6 flex flex-col items-center"><div className="relative rounded-2xl border border-[#d5dfd8] bg-white p-4 shadow-sm">{qrReady ? <img src={session.qrDataUrl ?? ""} alt="رمز QR لربط واتساب" className="h-[145px] w-[145px] sm:h-[171px] sm:w-[171px]" /> : <div className="grid grid-cols-[repeat(13,9px)] gap-[2px] sm:grid-cols-[repeat(13,11px)]">{qrCells.map((filled, index) => <span key={index} className={`h-[9px] w-[9px] rounded-[1px] sm:h-[11px] sm:w-[11px] ${filled ? "bg-[#184d40]" : "bg-transparent"}`} />)}</div>}<div className="absolute inset-0 grid place-items-center"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f8faf5] p-2 shadow-md"><img src={assets.logo} alt="وصلة" className="h-full w-full object-contain" /></div></div></div><button onClick={onStartQr} disabled={isBusy || session.status === "connected"} className="mt-5 flex items-center gap-2 rounded-xl bg-[#0e8065] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{isBusy ? "يتم إنشاء الرمز..." : session.status === "connected" ? "تم الربط بنجاح" : qrReady ? "تحديث الرمز" : "إنشاء رمز حقيقي"}<RefreshCw size={14} /></button><div className="mt-3 flex items-center gap-2 text-xs text-[#71857b]"><RefreshCw size={14} />{qrReady ? "الرمز صالح للمسح من تطبيق واتساب." : "ابدأ إنشاء الرمز من هذه اللوحة."}</div></div> : <div className="mt-8"><label className="text-sm font-bold text-[#315347]" htmlFor="phone">رقم الهاتف</label><div className="mt-3 flex gap-2"><input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" placeholder="+966 5X XXX XXXX" className="h-12 min-w-0 flex-1 rounded-xl border border-[#d7dfd8] bg-white px-4 text-sm outline-none placeholder:text-[#a7b2ab] focus:border-[#0e8065] focus:ring-4 focus:ring-[#0e8065]/10" /><button onClick={() => onStartPairing(phone)} disabled={isBusy || !phone.trim()} className="h-12 rounded-xl bg-[#0e8065] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{isBusy ? "جارٍ الإنشاء" : "إنشاء الكود"}</button></div><p className="mt-3 text-xs leading-5 text-[#74877e]">أدخل الرقم بصيغة دولية ثم افتح واتساب لإدخال كود الربط عند طلبه.</p><div className="mt-6 rounded-xl border border-dashed border-[#c5d8cc] bg-[#f5f8f4] p-4 text-center font-mono text-xl tracking-[0.25em] text-[#0e8065]">{session.pairingCode || "— — — — — — — —"}</div></div>}{(error || session.error) && <p className="mt-4 rounded-xl bg-[#fff0ec] p-3 text-xs leading-5 text-[#a44b33]">{error || session.error}</p>}<div className="mt-7 flex justify-between border-t border-[#e6e8e2] pt-5"><button onClick={onClose} className="text-xs font-bold text-[#647c71] hover:text-[#234e41]">إلغاء</button><button className="flex items-center gap-1.5 text-xs font-bold text-[#0e8065] hover:text-[#096a54]">تحتاج مساعدة؟ <ArrowLeft size={14} /></button></div></div></div></div></div>;
}

function MetricCard({ icon: Icon, label, value, hint, shade }: { icon: LucideIcon; label: string; value: string; hint: string; shade: "emerald" | "sky" | "sand" }) {
  const tones = { emerald: "bg-[#e2f1e9] text-[#0e8065]", sky: "bg-[#e4f1f4] text-[#438090]", sand: "bg-[#f5eeda] text-[#a37b2e]" };
  return <div className="rounded-2xl border border-[#dde0d9] bg-[#fbfaf6] p-5 shadow-[0_10px_28px_rgba(51,71,60,0.035)]"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[shade]}`}><Icon size={18} /></span><span className="font-mono text-2xl font-medium tracking-[-0.08em] text-[#284d40]">{value}</span></div><p className="mt-4 text-sm font-bold text-[#48645a]">{label}</p><p className="mt-1 text-xs text-[#8a9a92]">{hint}</p></div>;
}

function WorkflowStage({ number, title, detail, state, tone, logo = false }: { number: string; title: string; detail: string; state: string; tone: "emerald" | "sky" | "sand"; logo?: boolean }) {
  const tones = { emerald: "border-[#0e8065]/25 bg-[#e2f1e9] text-[#0e8065]", sky: "border-[#78a9b7]/30 bg-[#e7f2f5] text-[#438090]", sand: "border-[#d5ad4f]/30 bg-[#f8f0dc] text-[#a37b2e]" };
  return <div className="flex items-center gap-3 rounded-xl bg-[#fbfaf6]/90 p-2.5"><span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border ${tones[tone]} font-mono text-xs font-bold shadow-[0_5px_13px_rgba(23,65,52,0.07)]`}>{logo ? <><img src={assets.logo} alt="رمز وصلة" className="h-5 w-5 object-contain" /><span className="absolute inset-[-5px] rounded-full border border-[#0e8065]/25" /></> : number}</span><div className="min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-bold text-[#264a3e]">{title}</p><span className="font-mono text-[9px] tracking-[0.08em] text-[#84968d]">{number}</span></div><p className="mt-0.5 text-xs text-[#71857b]">{detail}</p><p className={`mt-1 font-mono text-[9px] font-medium ${tone === "emerald" ? "text-[#0e8065]" : tone === "sky" ? "text-[#438090]" : "text-[#a37b2e]"}`}>{state}</p></div></div>;
}

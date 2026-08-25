import React from 'react';
import {
  ArrowRight, Brain, Stethoscope, ShieldCheck, Zap,
  Heart, BookOpen, Instagram, Send, Phone, Sparkles
} from 'lucide-react';

interface AboutPanelProps {
  onBack: () => void;
  darkMode: boolean;
}

const AboutPanel: React.FC<AboutPanelProps> = ({ onBack }) => {
  const features = [
    { icon: Brain,       color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  title: 'زیرەکیا دەستکرد',     desc: 'پێشکەفتی ترین مۆدێلێن AI' },
    { icon: Stethoscope, color: '#6366f1', bg: 'rgba(99,102,241,0.10)', title: 'داڕێژا نیشانان',      desc: 'شیکارکرنا نیشانان ب خێزی' },
    { icon: ShieldCheck, color: '#10b981', bg: 'rgba(16,185,129,0.10)', title: 'ژێدەرێن باوەرپێکری', desc: 'ستانداردێن زانستی' },
    { icon: Zap,         color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', title: 'بەرسیڤدانا خێز',      desc: 'چرکەکێن کەم' },
    { icon: BookOpen,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', title: 'کوردیا بادینی',        desc: 'زمانێ دایکێ' },
    { icon: Heart,       color: '#ec4899', bg: 'rgba(236,72,153,0.10)', title: 'ئاسان و گونجاو',       desc: 'بۆ هەمی تەمەنان' },
  ];

  const socials = [
    { icon: Send,      label: 'تێلیگرام',   color: '#0ea5e9', glow: 'rgba(14,165,233,0.25)' },
    { icon: Instagram, label: 'ئینستاگرام', color: '#ec4899', glow: 'rgba(236,72,153,0.25)' },
    { icon: Phone,     label: 'ژمارە',       color: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-200 pb-20"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      dir="rtl"
    >
      <style>{`
        @keyframes ap-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ap-hero   { }
        .ap-item   { animation: ap-fade-up 0.35s ease both; }
        .ap-item:nth-child(1) { animation-delay:.04s }
        .ap-item:nth-child(2) { animation-delay:.08s }
        .ap-item:nth-child(3) { animation-delay:.12s }
        .ap-item:nth-child(4) { animation-delay:.16s }
        .ap-item:nth-child(5) { animation-delay:.20s }
        .ap-item:nth-child(6) { animation-delay:.24s }
        .ap-shimmer-text {
          color: var(--text);
          font-weight: 900;
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="ap-hero relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.5),transparent_60%)]" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute right-5 z-20 p-2 bg-white/15 backdrop-blur-xl rounded-xl text-white border border-white/20 shadow-lg active:scale-90 transition-all"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <ArrowRight size={17} />
        </button>

        {/* Hero content */}
        <div
          className="relative z-10 flex flex-col items-center px-6 text-center"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)', paddingBottom: '20px' }}
        >
          {/* Icon badge */}
          <div className="w-[54px] h-[54px] rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center shadow-xl mb-3">
            <Stethoscope size={26} className="text-white" strokeWidth={1.6} />
          </div>

          {/* App name */}
          <h1 className="text-white font-black text-[1.3rem] tracking-tight leading-tight">
            دکتۆرێ زیرەک
          </h1>
          <span className="text-white/55 text-[11px] font-bold tracking-widest mt-1">v2.3.4</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 max-w-md mx-auto space-y-4 pt-2">

        {/* Description card */}
        <div className="ap-item bg-white dark:bg-[#111118] rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Sparkles size={15} className="text-rose-500" />
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">دەربارەی پڕۆژەی</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold leading-[2] text-sm text-right">
            دکتۆرێ زیرەک ئەپڵیکەیشنەکە کو ب هێزا زیرەکیا دەستکرد (AI) کار دکەت. ب نڤیسینا نیشانێن نەخۆشیێ یان دانێ وێنەکێ پزیشکی، راپۆرتەکا زانستی و کورتکری ب کوردیا بادینی دێ وەرگری.
          </p>
        </div>

        {/* Features grid */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">تایبەتمەندیان</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="ap-item bg-white dark:bg-[#111118] rounded-[1.4rem] border border-slate-100 dark:border-white/[0.06] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${0.06 + i * 0.04}s` }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: f.bg }}
                  >
                    <Icon size={17} style={{ color: f.color }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-100 text-sm leading-snug">{f.title}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="ap-item bg-gradient-to-br from-rose-500 to-indigo-600 rounded-3xl p-5 shadow-lg shadow-rose-200/30 dark:shadow-rose-950/20">
          <div className="grid grid-cols-3 divide-x-reverse divide-x divide-white/20 text-center">
            {[
              { val: '٦', label: 'تایبەتمەندی' },
              { val: '١٠٠٪', label: 'بادینی' },
              { val: '∞', label: 'شیکاری' },
            ].map(s => (
              <div key={s.label} className="px-3 flex flex-col items-center gap-1">
                <span className="text-[1.6rem] font-black text-white leading-none">{s.val}</span>
                <span className="text-[10px] font-bold text-white/60 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="ap-item bg-white dark:bg-[#111118] rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm p-6">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 text-center mb-5 tracking-widest uppercase">پەیوەندیێ ب مە بکە</p>
          <div className="flex items-center justify-center gap-5">
            {socials.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.label} className="flex flex-col items-center gap-2 group active:scale-90 transition-all">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1"
                    style={{
                      background: `${s.color}18`,
                      border: `1.5px solid ${s.color}30`,
                      boxShadow: `0 8px 24px ${s.glow}`,
                    }}
                  >
                    <Icon size={22} style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPanel;

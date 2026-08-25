import React from 'react';
import {
  ArrowRight, Code2, Palette, Server,
  Mail, Instagram, Send, Phone, Cpu, Layers, UserRound, Briefcase
} from 'lucide-react';

interface DeveloperPanelProps {
  onBack: () => void;
  darkMode: boolean;
}

const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ onBack }) => {
  const skills = [
    { label: 'React / TypeScript', icon: Code2,   color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
    { label: 'UI / UX Design',     icon: Palette,  color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'   },
    { label: 'Node.js',            icon: Server,   color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
    { label: 'Tailwind CSS',       icon: Layers,   color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
    { 
      label: 'HTML5', 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={{ width: props.size, height: props.size, ...props.style }}>
          <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.078 6.094H5.41l.36 4.053h10.422l-.39 4.382-3.805 1.055-3.82-1.07-.24-2.724H6.012l.465 5.25 5.513 1.547 5.5-1.53.72-8.082.368-4.116-.04-.265z" />
        </svg>
      ), 
      color: '#e34f26', 
      bg: 'rgba(227,79,38,0.12)' 
    },
    { 
      label: 'CSS3', 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={{ width: props.size, height: props.size, ...props.style }}>
          <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.03 6.094H5.344l.322 3.656h10.703l-.322 3.625-4.047 1.094-4.062-1.125-.26-2.922H5.78l.49 5.562 5.719 1.578 5.703-1.547.781-8.797.188-2.125z" />
        </svg>
      ), 
      color: '#1572b6', 
      bg: 'rgba(21,114,182,0.12)' 
    },
    { 
      label: 'JavaScript', 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={{ width: props.size, height: props.size, ...props.style }}>
          <path d="M0 0h24v24H0z"/>
          <path d="M12 18.5c0 1.3-.4 2.2-1.3 2.8-.7.4-1.6.6-2.8.6-1 0-1.8-.2-2.4-.6v-2.8h1.8v1.6c0 .4.4.6.9.6s.7-.2.7-.6v-6.9H12v5.3zm8.3-2.1c-.2-1.3-1.1-2.1-2.6-2.1-1.6 0-2.6 1.1-2.6 2.6 0 1.9 1.6 2.3 2.8 2.8.8.3 1 .5 1 .9 0 .5-.4.8-1 .8-.8 0-1.3-.4-1.5-1h-1.8c.2 1.6 1.3 2.6 3.3 2.6 1.9 0 3-1 3-2.6 0-1.8-1.3-2.4-2.8-2.9-.8-.3-1.1-.6-1.1-1 0-.4.3-.7.8-.7.6 0 1 .3 1.2.7l1.4-.9z" fill="#000000"/>
        </svg>
      ), 
      color: '#f5b041', 
      bg: 'rgba(245,176,65,0.12)' 
    },
    { 
      label: 'Kotlin', 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={{ width: props.size, height: props.size, ...props.style }}>
          <path d="M24 24H0V0h24L12 12z" />
        </svg>
      ), 
      color: '#7f52ff', 
      bg: 'rgba(127,82,255,0.12)' 
    },
    { 
      label: 'Python', 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={{ width: props.size, height: props.size, ...props.style }}>
          <path d="M11.927 0C5.37 0 5.59 5.67 5.59 5.67l.03 5.86h12.62s5.75-.24 5.75-5.83S18.48 0 11.927 0zm-3.41 1.77c.56 0 1 .44 1 1s-.44 1-1 1-1-.44-1-1 .44-1 1-1zm3.41 20.46c6.56 0 6.34-5.67 6.34-5.67l-.03-5.86H5.617s-5.75.24-5.75 5.83 5.51 5.7 12.063 5.7zm3.41-1.77c-.56 0-1-.44-1-1s.44-1 1-1 1 .44 1 1-.44 1-1 1z" />
        </svg>
      ), 
      color: '#3776ab', 
      bg: 'rgba(55,118,171,0.12)' 
    }
  ];

  const services = [
    { title: 'دروستکرنا ماڵپەڕان',   desc: 'ماڵپەڕێن نوژدار و بچالاک ب React',  dot: '#f43f5e' },
    { title: 'ئەپڵیکەیشنێن مۆبایل', desc: 'ئەپا بۆ iOS و Android',             dot: '#6366f1' },
    { title: 'یەکخستنا AI',           desc: 'ئامادەکرنا چارەسەرێن AI بۆ پڕۆژەی', dot: '#10b981' },
    { title: 'دیزاینا UI/UX',         desc: 'ئینتەرفەیسێن جوان و ئاسان',         dot: '#8b5cf6' },
  ];

  const contacts = [
    { icon: Send,      label: 'تێلیگرام',   color: '#0ea5e9', glow: 'rgba(14,165,233,0.22)'  },
    { icon: Instagram, label: 'ئینستاگرام', color: '#ec4899', glow: 'rgba(236,72,153,0.22)'  },
    { icon: Phone,     label: 'تەلەفۆن',    color: '#10b981', glow: 'rgba(16,185,129,0.22)'  },
    { icon: Mail,      label: 'ئیمەیل',     color: '#f59e0b', glow: 'rgba(245,158,11,0.22)'  },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-200 pb-20"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      dir="rtl"
    >
      <style>{`
        @keyframes dp-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dp-avatar {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dp-pulse-ring {
          0%,100% { box-shadow: 0 0 20px rgba(244,63,94,0.45), 0 0 0 0px rgba(99,102,241,0.4); }
          50%      { box-shadow: 0 0 35px rgba(244,63,94,0.65), 0 0 0 14px rgba(99,102,241,0); }
        }
        @keyframes dp-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .dp-item   { animation: dp-fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .dp-item:nth-child(1) { animation-delay:.08s }
        .dp-item:nth-child(2) { animation-delay:.13s }
        .dp-item:nth-child(3) { animation-delay:.18s }
        .dp-item:nth-child(4) { animation-delay:.23s }
        .dp-avatar {
          animation: 
            dp-avatar 0.6s cubic-bezier(0.34,1.56,0.64,1) both,
            dp-pulse-ring 3s ease-in-out infinite 0.6s;
        }
        .dp-float  { animation: dp-float 4s ease-in-out infinite; }
        .dp-skill  { transition: transform .15s ease, box-shadow .15s ease; }
        .dp-skill:hover { transform: translateY(-2px); }
      `}</style>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0f0f1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.30),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(244,63,94,0.22),transparent_55%)]" />


        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-5 right-5 z-20 p-2.5 bg-white/10 backdrop-blur-xl rounded-2xl text-white border border-white/15 shadow-lg active:scale-90 transition-all hover:bg-white/20"
        >
          <ArrowRight size={19} />
        </button>

        <div className="relative z-10 flex flex-col items-center pt-14 pb-14 px-6">
          {/* Avatar */}
          <div
            className="dp-avatar w-[96px] h-[96px] rounded-[2rem] mb-5 flex items-center justify-center p-1.5"
            style={{ 
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#f43f5e)'
            }}
          >
            <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-slate-900">
              <img
                src="/image.png"
                alt="Hajan Salih"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Name */}
          <h1 className="text-white font-black text-2xl tracking-tight">Hajan Salih</h1>
          <p className="text-indigo-300/80 font-bold text-sm mt-1">Full-Stack Developer · AI Engineer</p>

        </div>

        {/* Wave */}
        <div className="relative h-8 -mb-px">
          <svg viewBox="0 0 1440 32" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            <path d="M0,32 C360,0 1080,0 1440,32 L1440,32 L0,32 Z"
              className="fill-slate-50 dark:fill-[#0a0a0f] transition-colors duration-300" />
          </svg>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 max-w-md mx-auto space-y-4 pt-2">

        {/* Bio */}
        <div className="dp-item bg-white dark:bg-[#111118] rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-rose-500" />
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">دەربارەی گەشەپێدەر</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold leading-[2] text-sm text-right">
            Hajan Salih، توێژەر و گەشەپێدەر د بواری زانیاریێن کۆمپیۆتەری و سیستەمێن تەکنەلۆژی دا. تایبەتمەندە د داڕشتن و گەشەپێدانا ئەپڵیکەیشنێن پێشکەفتی و یەکخستنا مۆدێلێن زیرەکیا دەستکرد (AI) بۆ پێشکەشکرنا چارەسەریێن زیرەک و زانستی. پڕۆژەیا «دکتۆرێ زیرەک» نموونەیەکا سەرکەفتی یە ژ کارێن وی یێن تەکنیکی بۆ خزمەتکرنا جڤاکێ ساخلەمیێ.
          </p>
        </div>

        {/* Skills */}
        <div className="dp-item bg-white dark:bg-[#111118] rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-rose-500" />
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">بتوانیێن تەکنیکی</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="dp-skill flex items-center gap-1.5 px-3 py-2 rounded-2xl cursor-default"
                  style={{ background: s.bg, border: `1px solid ${s.color}25` }}
                >
                  <Icon size={12} style={{ color: s.color }} strokeWidth={2.2} />
                  <span className="text-xs font-black" style={{ color: s.color }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Services */}
        <div className="dp-item bg-white dark:bg-[#111118] rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-rose-500" />
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">خزمەتگوزارییان</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {services.map(svc => (
              <div key={svc.title} className="flex items-center justify-between py-3.5 gap-3">
                <div className="flex-1 text-right">
                  <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{svc.title}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold mt-0.5">{svc.desc}</p>
                </div>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: svc.dot, boxShadow: `0 0 6px ${svc.dot}` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="dp-item bg-white dark:bg-[#111118] rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-rose-500" />
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">پەیوەندی</span>
          </div>
          <div className="flex items-center justify-around">
            {contacts.map(c => {
              const Icon = c.icon;
              return (
                <button key={c.label} className="flex flex-col items-center gap-2 group active:scale-90 transition-all">
                  <div
                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1"
                    style={{
                      background: `${c.color}14`,
                      border: `1.5px solid ${c.color}28`,
                      boxShadow: `0 6px 20px ${c.glow}`,
                    }}
                  >
                    <Icon size={20} style={{ color: c.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-bold text-slate-300 dark:text-slate-700 pt-2 pb-1">
          © ٢٠٢٥ · هاجان سالح · هەمی مافێن پارستی
        </p>
      </div>
    </div>
  );
};

export default DeveloperPanel;

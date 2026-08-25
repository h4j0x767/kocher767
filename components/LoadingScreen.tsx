import React, { useState, useEffect } from 'react';
import { Search, Microscope, ClipboardCheck } from 'lucide-react';

interface LoadingScreenProps {
  imageUrl?: string | null;
}

const steps = [
  {
    icon: Search,
    text: 'پشکنینا نیشانان',
    sub: 'سیستەم ب شێوەکێ ورد ل نیشانێن تە دگەڕیت...',
  },
  {
    icon: Microscope,
    text: 'شیکاریا داتایێن پزیشکی',
    sub: 'بەراوردکرن دگەل نوێترین ژێدەرێن نوژداری...',
  },
  {
    icon: ClipboardCheck,
    text: 'ئامادەکرنا راپۆرتا نۆژداری',
    sub: 'رێکخستنا شیکاریێ ب شێوەیەکێ ئەکادیمی و ب بادینی...',
  },
];

/* ─── Image Scan Variant (Clean iOS Scanner) ─── */
const ImageLoader: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStep((p) => (p + 1) % steps.length);
        setFade(true);
      }, 300);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const cur = steps[step];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      dir="rtl"
    >
      <style>{`
        @keyframes ios-scan {
          0%   { top: 0%; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .ios-scan-bar {
          position: absolute; left: 0; right: 0; height: 2px;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
          animation: ios-scan 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Clean Scanner Frame */}
      <div
        className="relative flex items-center justify-center rounded-3xl overflow-hidden border shadow-xl"
        style={{
          width: 'min(240px, 70vw)',
          height: 'min(240px, 70vw)',
          borderColor: 'var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div className="ios-scan-bar" />
        <img
          src={imageUrl}
          alt="Scanning"
          className="w-full h-full object-cover"
          style={{ opacity: 0.9 }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--accent)',
            }}
          >
            {React.createElement(cur.icon, { size: 24, strokeWidth: 2 })}
          </div>
        </div>
      </div>

      {/* Minimal Status Text */}
      <div
        className="text-center mt-6 max-w-xs"
        style={{
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {cur.text}
        </h2>
        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text2)' }}>
          {cur.sub}
        </p>
      </div>

      {/* Sleek iOS Spinner Dots */}
      <div className="flex items-center gap-1.5 mt-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 16 : 5,
              height: 5,
              background: i === step ? 'var(--accent)' : 'var(--border)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Text Query Variant (Clean Cupertino iOS Spinner) ─── */
const TextLoader: React.FC = () => {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStep((p) => (p + 1) % steps.length);
        setFade(true);
      }, 300);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setProgress(0);
    const p = setInterval(() => setProgress((v) => Math.min(v + 1.5, 96)), 60);
    return () => clearInterval(p);
  }, []);

  const cur = steps[step];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      dir="rtl"
    >
      <style>{`
        @keyframes ios-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ios-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        .ios-spinner-ring {
          animation: ios-spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .ios-icon-pulse {
          animation: ios-pulse 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* ── Sleek iOS Spinner with Center Icon ── */}
      <div className="relative flex items-center justify-center mb-6" style={{ width: 110, height: 110 }}>
        {/* Background track circle */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 110">
          <circle
            cx="55"
            cy="55"
            r="46"
            fill="none"
            strokeWidth="3"
            stroke="var(--border)"
          />
        </svg>

        {/* Smooth iOS active spinning arc */}
        <svg className="ios-spinner-ring absolute inset-0 w-full h-full" viewBox="0 0 110 110">
          <circle
            cx="55"
            cy="55"
            r="46"
            fill="none"
            strokeWidth="3"
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeDasharray="65 220"
          />
        </svg>

        {/* Center rounded icon */}
        <div
          className="ios-icon-pulse w-16 h-16 rounded-full flex items-center justify-center border shadow-md"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--accent)',
          }}
        >
          {React.createElement(cur.icon, { size: 24, strokeWidth: 2 })}
        </div>
      </div>

      {/* ── Status Text ── */}
      <div
        className="text-center px-4 max-w-xs"
        style={{
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <h2 className="text-lg font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
          {cur.text}
        </h2>
        <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text2)' }}>
          {cur.sub}
        </p>
      </div>

      {/* ── Refined Slim iOS Progress Bar ── */}
      <div className="mt-6 flex flex-col items-center gap-1.5" style={{ width: 140 }}>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{
            height: 3,
            background: 'var(--border)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Main Export ─── */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ imageUrl }) =>
  imageUrl ? <ImageLoader imageUrl={imageUrl} /> : <TextLoader />;

export default LoadingScreen;
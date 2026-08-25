import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exit'), 4800);
    const doneTimer = setTimeout(onFinished, 5600);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  const handleVideoEnd = () => {
    if (phase !== 'exit') {
      setPhase('exit');
      setTimeout(onFinished, 800);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#06060e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.8s cubic-bezier(0.4,0,0.2,1), transform 0.8s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes sp-kenburns {
          0%   { transform: scale(1.0); }
          100% { transform: scale(1.10); }
        }
        @keyframes sp-fade-up {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-scale-in {
          0%   { opacity: 0; transform: scale(0.55); }
          65%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sp-glow-pulse {
          0%, 100% { opacity: 0.12; transform: scale(0.9); }
          50%       { opacity: 0.25; transform: scale(1.1); }
        }
        @keyframes sp-logo-breathe {
          0%, 100% { filter: drop-shadow(0 0 14px rgba(244,63,94,0.5));  transform: scale(1);    }
          50%       { filter: drop-shadow(0 0 32px rgba(244,63,94,0.8)) drop-shadow(0 0 60px rgba(99,102,241,0.4)); transform: scale(1.045); }
        }
        @keyframes sp-orbit-1 {
          from { transform: rotate(0deg)   translateX(76px) rotate(0deg);   }
          to   { transform: rotate(360deg) translateX(76px) rotate(-360deg); }
        }
        @keyframes sp-orbit-2 {
          from { transform: rotate(180deg)  translateX(58px) rotate(-180deg); }
          to   { transform: rotate(-180deg) translateX(58px) rotate(180deg);  }
        }
        @keyframes sp-ring-cw  { from { transform: rotate(0deg); }   to { transform: rotate(360deg);  } }
        @keyframes sp-ring-ccw { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes sp-progress {
          0%   { width: 0%; }
          100% { width: 90%; }
        }
        @keyframes sp-shimmer {
          0%   { background-position: -400% center; }
          100% { background-position:  400% center; }
        }
        @keyframes sp-tag-in {
          0%   { opacity: 0; transform: scaleX(0.5) translateY(6px); }
          100% { opacity: 1; transform: scaleX(1)   translateY(0);   }
        }
        @keyframes sp-dot-blink {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40%            { opacity: 1;    transform: scale(1.1);  }
        }

        .sp-video      { animation: sp-kenburns 7s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .sp-glow       { animation: sp-glow-pulse 3.5s ease-in-out infinite; }
        .sp-logo       {
          animation:
            sp-scale-in   0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both,
            sp-logo-breathe 3.2s ease-in-out 1.2s infinite;
        }
        .sp-orbit-1    { animation: sp-orbit-1 4.5s linear infinite; }
        .sp-orbit-2    { animation: sp-orbit-2 3.2s linear infinite; }
        .sp-outer-ring { animation: sp-ring-cw  9s linear infinite; }
        .sp-inner-ring { animation: sp-ring-ccw 5.5s linear infinite; }
        .sp-title      { animation: sp-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s  both; }
        .sp-sub        { animation: sp-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s  both; }
        .sp-tag        { animation: sp-tag-in  0.7s cubic-bezier(0.16,1,0.3,1) 0.85s both; }
        .sp-progress   { animation: sp-fade-up 0.6s ease 1.0s both; }
        .sp-credit     { animation: sp-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 1.1s  both; }
        .sp-bar {
          background-size: 400% 100%;
          animation:
            sp-progress 4.2s cubic-bezier(0.4,0,0.2,1) 1.0s both,
            sp-shimmer  2.0s linear infinite;
        }
        .sp-dot-1 { animation: sp-dot-blink 1.4s ease-in-out 0.0s infinite; }
        .sp-dot-2 { animation: sp-dot-blink 1.4s ease-in-out 0.2s infinite; }
        .sp-dot-3 { animation: sp-dot-blink 1.4s ease-in-out 0.4s infinite; }
      `}</style>

      {/* ── Video background ── */}
      <div
        className="sp-video"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <video
          src="/A_cute_friendly_D_Pixar_styl.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
        />
        {/* Cinematic vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse at center, transparent 20%, rgba(6,6,14,0.7) 100%)',
            'linear-gradient(to top, rgba(6,6,14,1) 0%, rgba(6,6,14,0.2) 40%, rgba(6,6,14,0.5) 100%)',
          ].join(', '),
        }} />
      </div>

      {/* ── Ambient glow blob ── */}
      <div
        className="sp-glow"
        style={{
          position: 'absolute', zIndex: 2, pointerEvents: 'none',
          width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.55) 0%, rgba(99,102,241,0.28) 45%, transparent 72%)',
          filter: 'blur(90px)',
        }}
      />

      {/* ── Main content ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* ── Logo ring cluster ── */}
        <div style={{
          position: 'relative', width: 210, height: 210,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
        }}>
          {/* Outer dashed ring */}
          <svg
            className="sp-outer-ring"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox="0 0 210 210"
          >
            <circle
              cx="105" cy="105" r="96"
              fill="none" strokeWidth="1.5"
              stroke="rgba(244,63,94,0.2)"
              strokeDasharray="10 8"
            />
          </svg>

          {/* Inner arc ring */}
          <svg
            className="sp-inner-ring"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox="0 0 210 210"
          >
            <circle
              cx="105" cy="105" r="76"
              fill="none" strokeWidth="2"
              stroke="rgba(99,102,241,0.3)"
              strokeLinecap="round"
              strokeDasharray="42 130"
            />
          </svg>

          {/* Orbit 1 — rose dot */}
          <div
            className="sp-orbit-1"
            style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -4.5, marginLeft: -4.5 }}
          >
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: '#f43f5e',
              boxShadow: '0 0 12px rgba(244,63,94,0.9)',
            }} />
          </div>

          {/* Orbit 2 — indigo dot */}
          <div
            className="sp-orbit-2"
            style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#6366f1',
              boxShadow: '0 0 12px rgba(99,102,241,0.9)',
            }} />
          </div>

          {/* Center logo box */}
          <div
            className="sp-logo"
            style={{
              width: 104, height: 104, borderRadius: 30,
              background: 'rgba(244,63,94,0.09)',
              border: '2px solid rgba(244,63,94,0.32)',
              boxShadow: '0 0 70px rgba(244,63,94,0.3), 0 0 0 16px rgba(244,63,94,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Medical / AI icon */}
            <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
              {/* Cross */}
              <rect x="23" y="10" width="8" height="34" rx="4" fill="rgba(244,63,94,0.85)" />
              <rect x="10" y="23" width="34" height="8" rx="4" fill="rgba(244,63,94,0.85)" />
              {/* Corner sparkles */}
              <circle cx="10" cy="10" r="2.5" fill="rgba(99,102,241,0.7)" />
              <circle cx="44" cy="10" r="2.5" fill="rgba(99,102,241,0.7)" />
              <circle cx="10" cy="44" r="2.5" fill="rgba(99,102,241,0.7)" />
              <circle cx="44" cy="44" r="2.5" fill="rgba(99,102,241,0.7)" />
              {/* Center glow dot */}
              <circle cx="27" cy="27" r="4" fill="white" opacity="0.95" />
            </svg>
          </div>
        </div>

        {/* ── App name ── */}
        <div className="sp-title" style={{ textAlign: 'center', marginBottom: 10 }}>
          <h1 style={{
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: '-0.025em',
            margin: 0,
            lineHeight: 1.05,
            background: 'linear-gradient(135deg, #ffffff 25%, rgba(244,63,94,0.95) 60%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            نۆژدارێ زیرەک
          </h1>
        </div>

        {/* ── Subtitle ── */}
        <p
          className="sp-sub"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.42)',
            textAlign: 'center',
            margin: '0 0 32px',
            letterSpacing: '0.01em',
            maxWidth: 260,
            lineHeight: 1.5,
          }}
        >
          یارمەتیدەرێ تە یێ ساخلەمیێ دگەل زیرەکیا دەستکرد
        </p>

        {/* ── Progress bar ── */}
        <div
          className="sp-progress"
          style={{ width: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          {/* Track */}
          <div style={{
            width: '100%', height: 4, borderRadius: 99,
            background: 'rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}>
            <div
              className="sp-bar"
              style={{
                height: '100%', borderRadius: 99,
                backgroundImage: 'linear-gradient(90deg, rgba(244,63,94,0.5) 0%, #f43f5e 35%, #a855f7 65%, rgba(99,102,241,0.8) 100%)',
                boxShadow: '0 0 14px rgba(244,63,94,0.55)',
              }}
            />
          </div>

          {/* Animated loading dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="sp-dot-1" style={{ width: 5, height: 5, borderRadius: '50%', background: '#f43f5e' }} />
            <div className="sp-dot-2" style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7' }} />
            <div className="sp-dot-3" style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1' }} />
          </div>
        </div>
      </div>

      {/* ── Developer credit ── */}
      <div
        className="sp-credit"
        style={{
          position: 'absolute', bottom: 44, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        }}
      >
        {/* Thin divider */}
        <div style={{
          width: 48, height: 1, marginBottom: 6,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
        }} />
        <span style={{
          fontSize: 9, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.25)',
        }}>
          Developer &amp; Programmer
        </span>
        <span style={{
          fontSize: 17, fontWeight: 900,
          letterSpacing: '0.03em',
          background: 'linear-gradient(90deg, #f43f5e 10%, #a855f7 50%, #6366f1 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Hajan Salih
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;

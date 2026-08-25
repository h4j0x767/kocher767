import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, setDarkMode }) => {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (animating) return;
    setAnimating(true);
    setDarkMode(!darkMode);
    setTimeout(() => setAnimating(false), 500);
  };

  return (
    <>
      <style>{`
        @keyframes toggle-ripple {
          0%   { transform: scale(0.7); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes knob-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.82); }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes icon-swap {
          0%   { opacity: 1;   transform: rotate(0deg)   scale(1); }
          40%  { opacity: 0;   transform: rotate(90deg)  scale(0.4); }
          60%  { opacity: 0;   transform: rotate(-60deg) scale(0.4); }
          100% { opacity: 1;   transform: rotate(0deg)   scale(1); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.35); }
        }
        @keyframes sun-ray-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .toggle-knob-anim  { animation: knob-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .toggle-icon-anim  { animation: icon-swap 0.45s ease forwards; }
      `}</style>

      <button
        onClick={handleClick}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '64px',
          height: '34px',
          borderRadius: '999px',
          padding: '4px',
          cursor: 'pointer',
          outline: 'none',
          border: 'none',
          overflow: 'visible',
          background: 'transparent',
        }}
      >
        {/* ── Track ── */}
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '999px',
          background: darkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0c0a1e 100%)'
            : 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 40%, #38bdf8 100%)',
          boxShadow: darkMode
            ? '0 0 0 1.5px #312e81, 0 4px 18px rgba(99,102,241,0.35), inset 0 1px 3px rgba(0,0,0,0.6)'
            : '0 0 0 1.5px #7dd3fc, 0 4px 18px rgba(56,189,248,0.35), inset 0 1px 3px rgba(255,255,255,0.5)',
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
        }} />

        {/* ── Decorative stars (dark mode only) ── */}
        {[
          { top: '6px',  left: '10px', size: '2.5px', delay: '0s'    },
          { top: '16px', left: '16px', size: '2px',   delay: '0.4s'  },
          { top: '8px',  left: '22px', size: '2px',   delay: '0.8s'  },
        ].map((s, i) => (
          <span key={i} style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#c7d2fe',
            opacity: darkMode ? 0.55 : 0,
            animation: darkMode ? `star-twinkle 1.6s ease-in-out ${s.delay} infinite` : 'none',
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }} />
        ))}

        {/* ── Decorative sun rays (light mode only) ── */}
        <span style={{
          position: 'absolute',
          top: '50%',
          right: '9px',
          width: '14px',
          height: '14px',
          marginTop: '-7px',
          borderRadius: '50%',
          opacity: darkMode ? 0 : 0.35,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          animation: !darkMode ? 'sun-ray-spin 8s linear infinite' : 'none',
          background: 'transparent',
          boxShadow: '0 0 0 2px #fde68a',
          border: '1px dashed #fbbf24',
        }} />

        {/* ── Ripple on click ── */}
        {animating && (
          <span style={{
            position: 'absolute',
            top: '50%',
            left: darkMode ? '38px' : '10px',
            width: '18px',
            height: '18px',
            marginTop: '-9px',
            marginLeft: '-9px',
            borderRadius: '50%',
            background: darkMode ? '#818cf8' : '#fbbf24',
            opacity: 0.7,
            pointerEvents: 'none',
            animation: 'toggle-ripple 0.45s ease-out forwards',
          }} />
        )}

        {/* ── Knob ── */}
        <span
          className={animating ? 'toggle-knob-anim' : ''}
          style={{
            position: 'absolute',
            top: '4px',
            left: darkMode ? 'calc(100% - 30px)' : '4px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: darkMode
              ? 'linear-gradient(145deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)'
              : 'linear-gradient(145deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)',
            boxShadow: darkMode
              ? '0 2px 12px rgba(99,102,241,0.7), 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)'
              : '0 2px 12px rgba(251,191,36,0.7), 0 1px 3px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.7)',
            transition: 'left 0.45s cubic-bezier(0.34,1.56,0.64,1), background 0.45s ease, box-shadow 0.45s ease',
            willChange: 'left',
          }}
        >
          <span className={animating ? 'toggle-icon-anim' : ''} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease',
          }}>
            {darkMode
              ? <Moon size={13} strokeWidth={2.5} color="#e0e7ff" style={{ filter: 'drop-shadow(0 0 3px rgba(199,210,254,0.8))' }} />
              : <Sun  size={13} strokeWidth={2.5} color="#fff"    style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.9))' }} />
            }
          </span>
        </span>
      </button>
    </>
  );
};

export default ThemeToggle;

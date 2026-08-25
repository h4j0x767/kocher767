/**
 * BiometricLock.tsx
 * ──────────────────────────────────────────────────────────────────────────
 * Full-screen lock screen shown on app launch when biometric lock is enabled.
 * Supports: Fingerprint, Face ID, WebAuthn, and PIN fallback.
 * ──────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Eye, KeyRound, ShieldCheck, Loader2, AlertCircle, AlertTriangle, Stethoscope, Check } from 'lucide-react';
import {
  getBiometricCapability,
  authenticate,
  isBiometricLockEnabled,
  verifyPIN,
  hasPIN,
  BiometricType,
} from '../services/biometricService';

// ── Types ──────────────────────────────────────────────────────────────────

interface BiometricLockProps {
  onUnlocked: () => void;   // called when auth succeeds
  darkMode?: boolean;
}

type LockState = 'checking' | 'prompt' | 'loading' | 'pin' | 'success' | 'failed';

// ── PIN pad ────────────────────────────────────────────────────────────────

const PINPad: React.FC<{
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  darkMode?: boolean;
  error?: string;
}> = ({ onSubmit, onCancel, darkMode, error }) => {
  const [digits, setDigits] = useState('');

  const handleKey = (d: string) => {
    if (d === '⌫') {
      setDigits(prev => prev.slice(0, -1));
    } else if (digits.length < 6) {
      const next = digits + d;
      setDigits(next);
      if (next.length === 6) {
        setTimeout(() => onSubmit(next), 80);
      }
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* Dots */}
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
              i < digits.length
                ? 'bg-rose-500 scale-110'
                : darkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-rose-500 text-xs font-bold animate-shake">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {keys.map(k => (
          <button
            key={k}
            onClick={() => k === '✓' ? (digits.length === 6 && onSubmit(digits)) : handleKey(k)}
            className={`
              h-14 rounded-2xl font-black text-xl transition-all duration-150 active:scale-90
              ${darkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-600'
                : 'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100'}
              ${k === '✓' ? 'text-rose-500' : ''}
              ${k === '⌫' ? 'text-slate-400' : ''}
              shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-100'}
            `}
          >
            {k}
          </button>
        ))}
      </div>

      <button onClick={onCancel} className="text-xs text-slate-400 font-bold underline underline-offset-2">
        بگەرە
      </button>
    </div>
  );
};

// ── Biometric icon by type ─────────────────────────────────────────────────

const BiometricIcon: React.FC<{ type: BiometricType; size?: number; className?: string }> = ({
  type, size = 48, className = ''
}) => {
  if (type === 'face' || type === 'iris') return <Eye size={size} className={className} />;
  if (type === 'webauthn') return <ShieldCheck size={size} className={className} />;
  return <Fingerprint size={size} className={className} />;
};

// ── Main component ─────────────────────────────────────────────────────────

const BiometricLock: React.FC<BiometricLockProps> = ({ onUnlocked, darkMode = false }) => {
  const [lockState, setLockState] = useState<LockState>('checking');
  const [biometricType, setBiometricType] = useState<BiometricType>('fingerprint');
  const [pinError, setPinError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Auto-prompt biometric on mount
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLockState('checking');
    const cap = await getBiometricCapability();
    setBiometricType(cap.type);
    setLockState('prompt');

    // Auto-trigger biometric immediately
    if (cap.available) {
      await triggerBiometric(cap.type);
    }
  };

  const triggerBiometric = useCallback(async (type?: BiometricType) => {
    setLockState('loading');
    const result = await authenticate('دەستپێکرنا Dr. Badini AI پشتگیری ئاڤاهیا');
    if (result.success) {
      setLockState('success');
      setTimeout(onUnlocked, 600);
    } else {
      setLockState('failed');
      setAttempts(a => a + 1);
    }
  }, [onUnlocked]);

  const handlePINSubmit = async (pin: string) => {
    if (!hasPIN()) {
      // No PIN set — accept anything (first run)
      setLockState('success');
      setTimeout(onUnlocked, 400);
      return;
    }
    const ok = await verifyPIN(pin);
    if (ok) {
      setPinError('');
      setLockState('success');
      setTimeout(onUnlocked, 400);
    } else {
      setPinError('PIN-ا نادروستە. دوبارە بکە.');
      setAttempts(a => a + 1);
    }
  };

  const bg = darkMode
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';

  const textPrimary = darkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = darkMode ? 'text-slate-400' : 'text-slate-500';

  // ── Success overlay ──────────────────────────────────────────────────────
  if (lockState === 'success') {
    return (
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${bg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center animate-[scale-in_0.4s_ease_both]">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <p className={`font-black text-lg ${textPrimary} flex items-center gap-2`}>
            <Check size={20} className="text-emerald-400" /> دێلنیابوو
          </p>
        </div>
      </div>
    );
  }

  // ── PIN screen ───────────────────────────────────────────────────────────
  if (lockState === 'pin') {
    return (
      <div
        dir="rtl"
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 ${bg}`}
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-2 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <KeyRound size={32} className="text-rose-500" />
          </div>
          <h2 className={`text-xl font-black ${textPrimary}`}>کۆدا مەترسیدارێ</h2>
          <p className={`text-sm ${textSecondary}`}>6 ژمارە بنڤیسە</p>
        </div>

        <PINPad
          onSubmit={handlePINSubmit}
          onCancel={() => setLockState('prompt')}
          darkMode={darkMode}
          error={pinError}
        />

        {attempts >= 5 && (
          <p className="mt-6 text-rose-500 text-xs font-bold text-center flex items-center justify-center gap-1">
            <AlertTriangle size={13} className="shrink-0" /> {attempts} هەوڵ — دوبارە هەوڵ دەیت?
          </p>
        )}
      </div>
    );
  }

  // ── Main lock screen ─────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 ${bg} ios-pt-safe ios-pb-content`}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col items-center gap-6 z-10 text-center w-full max-w-xs">

        {/* App logo */}
        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-rose-500/30 mb-2">
          <Stethoscope size={44} className="text-white" strokeWidth={1.5} />
        </div>

        <div>
          <h1 className={`text-2xl font-black ${textPrimary}`}>Dr. Badini AI</h1>
          <p className={`text-sm font-semibold ${textSecondary} mt-1`}>
            پارێزگاری داتا — دڵنیابوونا لەواری پێدڤیە
          </p>
        </div>

        {/* Biometric button */}
        <button
          onClick={() => triggerBiometric()}
          disabled={lockState === 'loading'}
          className={`
            relative w-28 h-28 rounded-[2.5rem] flex flex-col items-center justify-center gap-2
            transition-all duration-300 active:scale-90 group
            ${darkMode
              ? 'bg-slate-800 border border-slate-700 hover:border-rose-500/50'
              : 'bg-white border border-slate-100 hover:border-rose-300'}
            shadow-xl
          `}
        >
          {lockState === 'loading' ? (
            <Loader2 size={40} className="text-rose-500 animate-spin" />
          ) : lockState === 'failed' ? (
            <>
              <AlertCircle size={36} className="text-amber-500" />
              <span className="text-[10px] font-black text-amber-500">دوبارە</span>
            </>
          ) : (
            <>
              <BiometricIcon
                type={biometricType}
                size={40}
                className={`${textSecondary} group-hover:text-rose-500 transition-colors duration-200`}
              />
              <span className={`text-[10px] font-black ${textSecondary} group-hover:text-rose-500 transition-colors`}>
                {biometricType === 'face' ? 'Face ID' :
                 biometricType === 'webauthn' ? 'دڵنیابوون' : 'بوینە'}
              </span>
            </>
          )}

          {/* Ripple ring on loading */}
          {lockState === 'loading' && (
            <div className="absolute inset-0 rounded-[2.5rem] border-2 border-rose-500/30 animate-ping" />
          )}
        </button>

        {lockState === 'failed' && (
          <p className="text-rose-500 text-xs font-bold">
            دڵنیابوون سەرنەکەت. دوبارە بکلیک بکە.
          </p>
        )}

        {lockState === 'checking' && (
          <p className={`text-sm font-bold ${textSecondary}`}>
            <Loader2 size={16} className="inline mr-1 animate-spin" />
            پشکنینا بیومتریک...
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
          <span className={`text-xs font-bold ${textSecondary}`}>یان</span>
          <div className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
        </div>

        {/* PIN fallback */}
        <button
          onClick={() => { setPinError(''); setLockState('pin'); }}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm
            transition-all duration-200 active:scale-95
            ${darkMode
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}
          `}
        >
          <KeyRound size={15} />
          کۆدا مەترسیدارێ بکار بئینە
        </button>

        <p className={`text-[11px] ${textSecondary} mt-2 px-4 leading-relaxed`}>
          داتایێن تە ب تمامی ل سەر ئامێرا تە پارێزراین. هیچ زانیارییەک نالێستێت.
        </p>
      </div>
    </div>
  );
};

export default BiometricLock;

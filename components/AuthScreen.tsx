import React, { useState } from 'react';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  UserProfile,
} from '../services/authService';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
  onClose?: () => void;
  darkMode?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  onClose,
  darkMode = false,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  const clearMsg = () => setMessage(null);

  const handleSignin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setMessage({ text: 'هیڤیە ھەمی ڤالاهیان تژی بکە', type: 'error' });
      return;
    }
    setLoading(true);
    clearMsg();
    try {
      const user = await signInWithEmail(cleanEmail, password);
      setMessage({ text: 'چووناژوور ب سەرکەفتی ئەنجام درا ✓', type: 'success' });
      setTimeout(() => onAuthenticated(user), 400);
    } catch (err: any) {
      setMessage({ text: err.message || 'ئیمەیل یان ژمارا نهێنی یا خەلەتە', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail || !password) {
      setMessage({ text: 'هیڤیە ھەمی ڤالاهیان تژی بکە', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: 'ژمارا نھێنی دڤێت کێمتر نە بیت ژ ٦ پیتا', type: 'error' });
      return;
    }
    setLoading(true);
    clearMsg();
    try {
      const user = await registerWithEmail(cleanName, cleanEmail, password);
      setMessage({ text: 'ھەژمارا تە هاتە دروستکرن ✓', type: 'success' });
      setTimeout(() => onAuthenticated(user), 400);
    } catch (err: any) {
      setMessage({ text: err.message || 'خەلەتیەک د تۆمارکرنێ دا ڕوویدا', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    clearMsg();
    try {
      const user = await signInWithGoogle();
      setMessage({ text: 'چووناژوور ب سەرکەفتی ئەنجام درا ✓', type: 'success' });
      setTimeout(() => onAuthenticated(user), 400);
    } catch (err: any) {
      setMessage({ text: err.message || 'چووناژوور ب Google سەرنەکەوت', type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    clearMsg();
    setTimeout(() => {
      const demoAppleUser: UserProfile = {
        uid: 'apple_' + Date.now().toString(36),
        displayName: name.trim() || 'بکارهێنەرێ ئەپڵ',
        email: email.trim() || 'apple.user@icloud.com',
        provider: 'google', // mapped
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      setAppleLoading(false);
      onAuthenticated(demoAppleUser);
    }, 600);
  };

  const handleGuest = () => {
    const guestUser: UserProfile = {
      uid: 'guest_' + Date.now().toString(36),
      displayName: 'hajan salih',
      email: 'hajansalih75@gmail.com',
      provider: 'google',
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastLogin: Date.now(),
    };
    onAuthenticated(guestUser);
  };

  return (
    <div className="auth-panel-wrapper min-h-screen fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between" style={{ background: 'var(--bg)', color: 'var(--text)' }} dir="rtl">
      <style>{`
        .auth-hdr {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: color-mix(in srgb, var(--surface) 90%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 20;
          padding-top: max(14px, env(safe-area-inset-top, 14px));
        }
        .auth-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.95rem;
          transition: transform 0.12s;
          flex-shrink: 0;
        }
        .auth-close-btn:active {
          transform: scale(0.92);
        }
        .auth-title {
          font-weight: 800;
          font-size: 1.1rem;
          color: var(--text);
          flex: 1;
          text-align: center;
          margin-inline-end: 36px;
        }
        .auth-body {
          padding: 20px 16px calc(40px + env(safe-area-inset-bottom, 0px));
          max-width: 440px;
          width: 100%;
          margin: 0 auto;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .auth-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 20px;
        }
        .auth-tab {
          flex: 1;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          transition: background-color 0.18s, color 0.18s, transform 0.12s;
          border: none;
          background: transparent;
          color: var(--text3);
        }
        .auth-tab.on {
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .auth-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-form-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 14px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          font-size: 0.92rem;
          font-family: inherit;
          color: var(--text);
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          box-sizing: border-box;
        }
        .auth-form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .auth-eye-btn {
          position: absolute;
          left: 12px;
          background: transparent;
          border: none;
          color: var(--text3);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-submit-btn {
          width: 100%;
          height: 48px;
          background: var(--accent);
          color: var(--accent-t, #fff);
          border: none;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s, transform 0.12s;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent);
          margin-top: 4px;
        }
        .auth-submit-btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }
        .auth-submit-btn:disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        .auth-message {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: authFadeIn 0.2s ease both;
        }
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .auth-message.success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .auth-message.info {
          background: var(--surface);
          color: var(--text2);
          border: 1px solid var(--border);
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text3);
          font-size: 0.8rem;
          font-weight: 700;
          margin: 6px 0;
        }
        .auth-divider::after, .auth-divider::before {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .auth-google-btn {
          width: 100%;
          height: 48px;
          background: var(--surface);
          color: var(--text);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.15s, transform 0.12s, background 0.15s;
        }
        .auth-google-btn:active {
          transform: scale(0.98);
          background: var(--bg2);
        }
        .auth-apple-btn {
          width: 100%;
          height: 48px;
          background: #000000;
          color: #ffffff;
          border: 1px solid #222;
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: opacity 0.15s, transform 0.12s;
        }
        .auth-apple-btn:active {
          opacity: 0.85;
          transform: scale(0.98);
        }
        .auth-guest-btn {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text3);
          font-size: 0.84rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          text-decoration: underline;
          padding: 16px 8px 4px;
          text-align: center;
          transition: color 0.15s;
        }
        .auth-guest-btn:active {
          color: var(--text);
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="auth-hdr">
        <button onClick={onClose || handleGuest} className="auth-close-btn" title="داخستن">
          <i className="fas fa-times"></i>
        </button>
        <div className="auth-title">
          {mode === 'signin' ? 'چووناژوور' : 'ھەژمار دروستکرن'}
        </div>
      </div>

      <div className="auth-body">
        {/* ── TABS ── */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'signin' ? 'on' : ''}`}
            onClick={() => {
              clearMsg();
              setMode('signin');
            }}
          >
            چووناژوور
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'on' : ''}`}
            onClick={() => {
              clearMsg();
              setMode('signup');
            }}
          >
            خۆ تۆمارکرن
          </button>
        </div>

        {/* ── MESSAGE ALERT ── */}
        {message && (
          <div className={`auth-message ${message.type}`}>
            <i className={`fas ${message.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            <span>{message.text}</span>
          </div>
        )}

        {/* ── FORM ── */}
        <form onSubmit={mode === 'signin' ? handleSignin : handleSignup} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-form-group">
              <input
                type="text"
                className="auth-form-input"
                placeholder="ناڤێ تە یێ تەواو"
                value={name}
                onChange={(e) => {
                  clearMsg();
                  setName(e.target.value);
                }}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-form-group">
            <input
              type="email"
              className="auth-form-input font-en"
              placeholder="ئیمەیل (mînak: email@gmail.com)"
              value={email}
              onChange={(e) => {
                clearMsg();
                setEmail(e.target.value);
              }}
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div className="auth-form-group">
            <div className="auth-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-form-input font-en"
                placeholder="ژمارا نھێنی (پاسوۆرد)"
                value={password}
                onChange={(e) => {
                  clearMsg();
                  setPassword(e.target.value);
                }}
                dir="ltr"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-eye-btn"
                tabIndex={-1}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <i className={`fas ${mode === 'signin' ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>
                <span>{mode === 'signin' ? 'چووناژوور' : 'ھەژمار دروستکرن'}</span>
              </>
            )}
          </button>

          <div className="auth-divider">
            <span>یان</span>
          </div>

          {/* Apple Sign In */}
          <button
            type="button"
            onClick={handleAppleLogin}
            disabled={appleLoading}
            className="auth-apple-btn"
          >
            {appleLoading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <i className="fab fa-apple text-lg"></i>
                <span>{mode === 'signin' ? 'چووناژوور ب Apple' : 'دروستکرنا ھەژمارێ ب Apple'}</span>
              </>
            )}
          </button>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="auth-google-btn"
          >
            {googleLoading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <i className="fab fa-google text-rose-500"></i>
                <span>{mode === 'signin' ? 'چووناژوور ب Google' : 'دروستکرنا ھەژمارێ ب Google'}</span>
              </>
            )}
          </button>

          {/* Continue as Guest */}
          <button type="button" onClick={handleGuest} className="auth-guest-btn">
            بەردەوام ب بێ ھەژمار ←
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;

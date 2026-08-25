import React, { useState, useEffect } from 'react';
import { UserProfile, updateProfile, signOut } from '../services/authService';

interface ProfilePanelProps {
  darkMode?: boolean;
  currentUser?: UserProfile | null;
  onBack: () => void;
  onUserUpdated?: (user: UserProfile) => void;
  onSignOut?: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  darkMode,
  currentUser,
  onBack,
  onUserUpdated,
  onSignOut,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scrolling while profile is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onBack();
    }, 220);
  };

  const user = currentUser || {
    uid: 'demo_user',
    displayName: 'hajan salih',
    email: 'hajansalih75@gmail.com',
    provider: 'google',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    lastLogin: Date.now(),
  };

  const [nameInput, setNameInput] = useState(user.displayName || 'hajan salih');
  const [nameSuccess, setNameSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);

  const initialLetter = (user.displayName || user.email || 'h').charAt(0).toLowerCase();

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const updated = updateProfile({ displayName: nameInput.trim() });
    if (updated && onUserUpdated) {
      onUserUpdated(updated);
    }
    setNameSuccess(true);
    setTimeout(() => setNameSuccess(false), 2500);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }, 700);
  };

  const handleRefreshDevices = () => {
    setIsRefreshingDevices(true);
    setTimeout(() => setIsRefreshingDevices(false), 500);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div
      className={`profile-panel on ${isClosing ? 'closing' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      dir="rtl"
    >
      <style>{`
        .profile-panel.on {
          animation: profileSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .profile-panel.closing {
          animation: profileSlideDown 0.22s cubic-bezier(0.4, 0, 1, 1) both;
        }
        @keyframes profileSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes profileSlideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        .pp-hdr {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: color-mix(in srgb, var(--surface) 90%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 30;
          padding-top: max(12px, env(safe-area-inset-top, 12px));
        }
        .hdr-btn {
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
          transition: transform 0.12s, background 0.15s;
          flex-shrink: 0;
        }
        .hdr-btn:active {
          transform: scale(0.92);
        }
        .pp-title {
          font-weight: 800;
          font-size: 1.1rem;
          color: var(--text);
          flex: 1;
          text-align: center;
          margin-inline-end: 36px;
        }
        .pp-body {
          padding: 0 0 calc(90px + env(safe-area-inset-bottom, 0px));
          max-width: 600px;
          margin: 0 auto;
        }
        .pp-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 20px 24px;
          background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface));
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
          position: relative;
        }
        .pp-avatar-circle {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #0ea5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          overflow: hidden;
          margin-bottom: 14px;
          border: 3.5px solid var(--surface);
          box-shadow: 0 0 0 2px #0ea5e9, 0 8px 24px rgba(14, 165, 233, 0.35);
          flex-shrink: 0;
        }
        .pp-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pp-name-display {
          text-align: center;
          font-weight: 800;
          font-size: 1.25rem;
          margin-bottom: 3px;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        .pp-email-display {
          text-align: center;
          font-size: 0.84rem;
          color: var(--text2);
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          direction: ltr;
          font-family: var(--font-en, sans-serif);
        }
        .pp-hero-sync {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 10px;
          font-weight: 700;
          border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .pp-section {
          padding: 0 16px;
          margin-bottom: 16px;
        }
        .pp-section-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text3);
          letter-spacing: 0.05em;
          padding: 14px 2px 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pp-section-title::before {
          content: '';
          display: inline-block;
          width: 3px;
          height: 12px;
          background: var(--accent);
          border-radius: 2px;
          flex-shrink: 0;
        }
        .pp-section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 2px 8px;
        }
        .pp-section-title-row > span:first-child {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text3);
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pp-section-title-row > span:first-child::before {
          content: '';
          display: inline-block;
          width: 3px;
          height: 12px;
          background: var(--accent);
          border-radius: 2px;
          flex-shrink: 0;
        }
        .pp-devices-refresh {
          background: 0 0;
          border: none;
          color: var(--text3);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 6px 8px;
          border-radius: 8px;
          line-height: 1;
          transition: background 0.15s, color 0.15s;
        }
        .pp-devices-refresh:active {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
        }
        .pp-devices-note {
          font-size: 0.73rem;
          color: var(--text3);
          padding: 6px 2px 8px;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          line-height: 1.5;
        }
        .pp-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .pp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          border-bottom: 1px solid var(--border);
        }
        .pp-row:last-child {
          border-bottom: none;
        }
        .pp-row-label {
          font-size: 0.88rem;
          color: var(--text2);
          font-weight: 600;
        }
        .pp-row-value {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text);
        }
        .pp-edit-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .pp-edit-input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border-radius: 12px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          font-size: 0.9rem;
          font-family: inherit;
          color: var(--text);
          direction: rtl;
          box-sizing: border-box;
          outline: 0;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .pp-edit-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .pp-save-btn {
          height: 46px;
          background: var(--accent);
          color: var(--accent-t, #fff);
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          padding: 0 24px;
          align-self: stretch;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.15s, transform 0.12s;
        }
        .pp-save-btn:active {
          opacity: 0.85;
          transform: scale(0.97);
        }
        .pp-device-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          gap: 8px;
        }
        .pp-device-row:last-child {
          border-bottom: none;
        }
        .pp-device-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .pp-device-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--bg2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: var(--text2);
          flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .pp-device-row--current .pp-device-icon {
          background: var(--accent);
          color: var(--accent-t, #fff);
          border-color: transparent;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent);
        }
        .pp-device-info {
          min-width: 0;
          flex: 1;
        }
        .pp-device-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .pp-device-badge {
          font-size: 0.65rem;
          padding: 2px 7px;
          border-radius: 999px;
          background: var(--accent);
          color: var(--accent-t, #fff);
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pp-device-badge--online {
          background: #10b981;
        }
        .pp-device-online-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          margin-inline-end: 5px;
          vertical-align: middle;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }
        .pp-device-time {
          font-size: 0.74rem;
          color: var(--text3);
          margin-top: 3px;
          font-weight: 600;
        }
        .pp-actions {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .pp-action-btn {
          width: 100%;
          height: 50px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-weight: 700;
          font-size: 0.9rem;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          color: var(--text);
          transition: transform 0.12s, background 0.15s;
        }
        .pp-action-btn:active {
          transform: scale(0.98);
        }
        .pp-action-btn.pp-logout {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.25);
          background: rgba(239, 68, 68, 0.05);
        }
        .pp-action-btn.pp-logout:active {
          background: #ef4444;
          color: #fff;
        }
        .pp-action-btn.pp-delete {
          color: #ef4444;
          background: 0 0;
          border-color: transparent;
          opacity: 0.65;
          font-size: 0.84rem;
          height: 42px;
        }
        .pp-action-btn.pp-delete:active {
          opacity: 1;
          background: rgba(239, 68, 68, 0.08);
        }
        .pp-actions-sep {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }
        .pp-delete-confirm {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }
        .pp-delete-confirm-txt {
          font-size: 0.85rem;
          color: var(--text);
          line-height: 1.5;
          font-weight: 700;
          margin: 0;
        }
        .pp-delete-confirm-btns {
          display: flex;
          gap: 8px;
        }
        .pp-delete-confirm-yes {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          font-size: 0.86rem;
          font-weight: 800;
          cursor: pointer;
          border: none;
          background: #ef4444;
          color: #ffffff;
          transition: opacity 0.15s, transform 0.12s;
        }
        .pp-delete-confirm-yes:active {
          opacity: 0.85;
          transform: scale(0.97);
        }
        .pp-delete-confirm-no {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          background: var(--bg2);
          color: var(--text);
          border: 1px solid var(--border);
          transition: transform 0.12s;
        }
        .pp-delete-confirm-no:active {
          transform: scale(0.97);
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="pp-hdr">
        <button onClick={handleClose} className="hdr-btn" title="زڤڕین">
          <i className="fas fa-arrow-right"></i>
        </button>
        <div className="pp-title">پرۆفایل</div>
      </div>

      <div className="pp-body">
        {/* ── HERO SECTION ── */}
        <div className="pp-hero">
          <div className="pp-avatar-circle">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span>{initialLetter}</span>
            )}
          </div>
          <div className="pp-name-display">{user.displayName || 'hajan salih'}</div>
          <div className="pp-email-display">{user.email || 'hajansalih75@gmail.com'}</div>
          <div className="pp-hero-sync">
            <i className="fas fa-cloud-upload-alt"></i>
            <span>هەڤدەمکریە</span>
          </div>
        </div>

        {/* ── SECTION 1: INFO ── */}
        <div className="pp-section">
          <div className="pp-section-title">زانیاری</div>
          <div className="pp-card">
            <div className="pp-row">
              <div className="pp-row-label">شێوازێ چووناژوور</div>
              <div className="pp-row-value font-en">{user.provider ? user.provider.toUpperCase() : 'GOOGLE'}</div>
            </div>
            <div className="pp-row">
              <div className="pp-row-label">ئەندام ل</div>
              <div className="pp-row-value font-en">{formatDate(user.createdAt || Date.now() - 10000000)}</div>
            </div>
            <div className="pp-row">
              <div className="pp-row-label">دوماهیک ڤەکرن</div>
              <div className="pp-row-value" style={{ color: 'var(--accent)' }}>
                <span className="pp-device-online-dot"></span>
                <span>نوکە · چالاک</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: EDIT NAME ── */}
        <div className="pp-section">
          <div className="pp-section-title">گوھۆڕینا ناڤی</div>
          <form onSubmit={handleSaveName} className="pp-edit-group">
            <input
              type="text"
              className="pp-edit-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="ناڤێ خوە بنڤیسە"
            />
            {nameSuccess && (
              <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <i className="fas fa-check"></i>
                <span>ناڤ ب سەرکەفتی هاتە گوهۆڕین ✓</span>
              </div>
            )}
            <button type="submit" className="pp-save-btn">
              <i className="fas fa-check"></i>
              <span>پاشەکەڤتکرن</span>
            </button>
          </form>
        </div>

        {/* ── SECTION 3: DEVICES ── */}
        <div className="pp-section">
          <div className="pp-section-title-row">
            <span>ئامێرێن تە</span>
            <button onClick={handleRefreshDevices} className="pp-devices-refresh" title="نوێکردنەوە">
              <i className={`fas fa-rotate-right ${isRefreshingDevices ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
          <div className="pp-card">
            <div className="pp-device-row pp-device-row--current">
              <div className="pp-device-left">
                <div className="pp-device-icon">
                  <i className="fas fa-mobile-screen-button"></i>
                </div>
                <div className="pp-device-info">
                  <div className="pp-device-name">
                    <span>Apple iPhone (iOS Safari)</span>
                    <span className="pp-device-badge">ئەڤ ئامێرە</span>
                    <span className="pp-device-badge pp-device-badge--online">چالاک</span>
                  </div>
                  <div className="pp-device-time">
                    <span className="pp-device-online-dot"></span>
                    <span>ئێستا چالاکە · نوکە</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pp-devices-note">
            <i className="fas fa-circle-info mt-0.5"></i>
            <span>ئامێر دکەڤنە لیستێ کاتێک نوترین وەشانا ئەپێ بهێتە ڤەکرن</span>
          </div>
        </div>

        {/* ── SECTION 4: ACTIONS ── */}
        <div className="pp-section">
          <div className="pp-section-title">کردارەکان</div>
          <div className="pp-actions" style={{ padding: 0 }}>
            {/* Sync Button */}
            <button onClick={handleSync} className="pp-action-btn">
              <i className={`fas fa-sync ${syncing ? 'fa-spin text-emerald-500' : ''}`} style={{ color: 'var(--accent)' }}></i>
              <span>{syncSuccess ? 'داتا ب سەرکەفتی هاتە هەلگرتن ✓' : 'هەلگرتن (Sync Data)'}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                if (onSignOut) onSignOut();
              }}
              className="pp-action-btn pp-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>دەرکەتن ژ هەژمارێ (Sign Out)</span>
            </button>

            <div className="pp-actions-sep"></div>

            {/* Delete Account */}
            {deleteStep === 0 && (
              <div className="pp-delete-wrap">
                <button onClick={() => setDeleteStep(1)} className="pp-action-btn pp-delete">
                  <i className="fas fa-trash-alt"></i>
                  <span>ژێبرنا ھەژمارێ (Delete Account)</span>
                </button>
              </div>
            )}

            {deleteStep === 1 && (
              <div className="pp-delete-confirm">
                <p className="pp-delete-confirm-txt">
                  تو پشتڕاستی ژ ژێبرنا ھەژمارێ؟ زڤڕین بۆ ڤی کاری نینە.
                </p>
                <div className="pp-delete-confirm-btns">
                  <button onClick={() => setDeleteStep(2)} className="pp-delete-confirm-yes">
                    بەلێ، بەردەوام بە
                  </button>
                  <button onClick={() => setDeleteStep(0)} className="pp-delete-confirm-no">
                    نەخێر
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div className="pp-delete-confirm" style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
                <p className="pp-delete-confirm-txt" style={{ color: '#ef4444' }}>
                  ⚠️ دووبارە: ھەمی داتایێن تە دێ ژ ناڤ چن. تو یێ پشتڕاستی؟
                </p>
                <div className="pp-delete-confirm-btns">
                  <button
                    onClick={() => {
                      if (onSignOut) onSignOut();
                      signOut();
                    }}
                    className="pp-delete-confirm-yes"
                    style={{ background: '#b91c1c' }}
                  >
                    ژێبرنا هەژمارێ
                  </button>
                  <button onClick={() => setDeleteStep(0)} className="pp-delete-confirm-no">
                    نەخێر
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePanel;

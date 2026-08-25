import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '../services/authService';
import ProfilePanel from './ProfilePanel';

interface SettingsPanelProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeMode: 'light' | 'dark' | 'system' | 'noor' | 'sakina';
  setThemeMode: (mode: any) => void;
  onOpenAbout?: () => void;
  onOpenDeveloper?: () => void;
  onOpenIntegration?: () => void;
  onOpenProfile?: () => void;
  onOpenLogin?: () => void;
  onOpenMeds?: () => void;
  currentUser?: UserProfile | null;
  onSignOut?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

interface ConfirmConfig {
  icon?: string;
  title: string;
  sub?: string;
  yes?: string;
  no?: string;
  danger?: boolean;
  onYes: () => void;
  onNo?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  darkMode,
  setDarkMode,
  themeMode,
  setThemeMode,
  onOpenAbout,
  onOpenDeveloper,
  onOpenIntegration,
  onOpenProfile,
  onOpenLogin,
  onOpenMeds,
  currentUser,
  onSignOut,
  onModalStateChange,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(() => localStorage.getItem('hapticFeedback') !== 'false');

  // ── Statistics State (6 Columns) ──
  const [stats, setStats] = useState({
    totalConsultations: 0,
    streak: 1,
    bookmarksCount: 0,
    bestStreak: 3,
    completedReports: 0,
    totalActivities: 0
  });

  // ── Sheets & Modals ──
  const [confirmDialog, setConfirmDialog] = useState<ConfirmConfig | null>(null);
  const [activeSheet, setActiveSheet] = useState<'app' | 'founder' | 'sources' | 'thanks' | 'profile' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lock background scroll when any sheet/modal is open (iOS-safe approach)
  useEffect(() => {
    const isModalOpen = Boolean(activeSheet || confirmDialog || showProfile);

    const preventScroll = (e: TouchEvent) => {
      // Allow touch inside the sheet itself (cfg-sheet class)
      const target = e.target as HTMLElement;
      if (target.closest('.cfg-sheet') || target.closest('[data-allow-scroll]')) return;
      e.preventDefault();
    };

    if (isModalOpen) {
      document.body.classList.add('modal-open');
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', preventScroll);
    }
    onModalStateChange?.(isModalOpen);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [activeSheet, confirmDialog, showProfile, onModalStateChange]);

  // ── iOS Drag-to-Dismiss State ──
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    if (diff > 0) {
      setSheetDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingSheet(false);
    if (sheetDragY > 85) {
      triggerHaptic('light');
      setActiveSheet(null);
    }
    setSheetDragY(0);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    if (!hapticFeedback) return;
    if (typeof window !== 'undefined') {
      try {
        if ((window as any).Capacitor?.Plugins?.Haptics) {
          (window as any).Capacitor.Plugins.Haptics.impact({ style: type === 'warning' ? 'HEAVY' : 'LIGHT' });
        } else if (navigator.vibrate) {
          navigator.vibrate(type === 'warning' ? [30, 50, 30] : 15);
        }
      } catch {}
    }
  };

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const streakSaved = parseInt(localStorage.getItem('user_streak') || '1', 10);
      const bestStreakSaved = parseInt(localStorage.getItem('user_best_streak') || '3', 10);

      setStats({
        totalConsultations: history.length,
        streak: Math.max(1, streakSaved),
        bookmarksCount: favorites.length,
        bestStreak: Math.max(bestStreakSaved, streakSaved),
        completedReports: Math.floor(history.length * 0.7),
        totalActivities: history.length + favorites.length
      });
    } catch {}
  }, []);

  // Theme definition cards (Exact TafsirKurd Colors & Order)
  const themes = [
    { id: 'sakina', name: 'کەسک', sub: 'Emerald', bg: '#0c1c12', surface: '#162d1f', accent: '#c9a84c' },
    { id: 'noor', name: 'نوور', sub: 'Parchment', bg: '#f4e8cc', surface: '#fdf4e3', accent: '#1a5c3a' },
    { id: 'dark', name: 'تاری', sub: 'Dark', bg: '#0a0a0a', surface: '#1a1a1a', accent: '#ffffff' },
    { id: 'light', name: 'ڕوون', sub: 'Light', bg: '#fafafa', surface: '#ffffff', accent: '#000000' },
  ];

  const handleSelectTheme = (themeId: string) => {
    triggerHaptic('light');
    setThemeMode(themeId as any);
    document.documentElement.setAttribute('data-theme', themeId);
    
    const bgMap: Record<string, string> = {
      dark: '#0a0a0a',
      sakina: '#0c1c12',
      noor: '#f4e8cc',
      light: '#fafafa'
    };
    const bg = bgMap[themeId] || '#f4e8cc';

    document.documentElement.style.background = bg;
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.style.colorScheme = (themeId === 'dark' || themeId === 'sakina') ? 'dark' : 'light';
    document.documentElement.style.setProperty('--bg', bg);
    
    if (document.body) {
      document.body.style.background = bg;
      document.body.style.backgroundColor = bg;
    }

    if (themeId === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
    
    localStorage.setItem('theme', themeId);
    localStorage.setItem('themeMode', themeId);
    localStorage.setItem('themeUserChosen', '1');
  };

  return (
    <div
      className="settings-page-container min-h-screen pb-20 font-sans text-right select-none transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      dir="rtl"
    >
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-950 font-bold text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 border border-white/10">
          <i className="fas fa-check-circle text-emerald-400"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── STICKY TOP HEADER ── */}
      <div
        className="sticky top-0 z-30 print:hidden transition-colors"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        }}
      >
        <div className="relative px-4 py-2.5 flex items-center justify-center max-w-xl mx-auto">
          <h1 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <i className="fas fa-sliders-h text-sm opacity-60"></i>
            <span>ڕێکخستن</span>
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5 space-y-6">

        {/* ── 1. PROFILE HERO CARD (TafsirKurd Style) ── */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            setShowProfile(true);
            onOpenProfile?.();
          }}
          className="profile-card relative overflow-hidden rounded-[1.75rem] p-6 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-all duration-150 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {(() => {
            const u = currentUser || {
              displayName: 'hajan salih',
              email: 'hajansalih75@gmail.com',
            };
            const initial = (u.displayName || u.email || 'H').charAt(0).toLowerCase();

            return (
              <>
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md mb-3.5 border-4"
                  style={{
                    background: '#0ea5e9',
                    borderColor: 'var(--surface)',
                    boxShadow: '0 6px 20px rgba(14, 165, 233, 0.35)',
                  }}
                >
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt={u.displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                <div className="profile-info flex flex-col items-center gap-1">
                  <h3 className="profile-name text-lg font-black" style={{ color: 'var(--text)' }}>
                    {u.displayName || 'hajan salih'}
                  </h3>
                  <p className="profile-email text-xs font-semibold max-w-xs truncate dir-ltr font-en" style={{ color: 'var(--text2)' }}>
                    {u.email || 'hajansalih75@gmail.com'}
                  </p>
                  <div
                    className="profile-sync flex items-center gap-1.5 text-[11px] font-bold mt-1.5 px-3.5 py-1 rounded-full border shadow-2xs"
                    style={{ color: 'var(--accent)', background: 'var(--bg2)', borderColor: 'var(--border)' }}
                  >
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>هەڤدەمکریە</span>
                  </div>
                </div>

                <div className="profile-chevron-row flex items-center gap-2 mt-4 text-xs font-bold transition-opacity hover:opacity-80" style={{ color: 'var(--text3)' }}>
                  <span>پرۆفایلی ببینە</span>
                  <i className="fas fa-chevron-left text-[10px]"></i>
                </div>
              </>
            );
          })()}
        </div>

        {/* ── 2. READING STATS CARD (6 Columns) ── */}
        <div
          className="stats-card border"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            width: '100%',
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="stats-col" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-book-open stats-icon" style={{ color: 'var(--accent)' }}></i>
            <div className="stats-num" style={{ color: 'var(--text)' }}>{stats.totalConsultations}</div>
            <div className="stats-lbl" style={{ color: 'var(--text3)' }}>شیکاری</div>
          </div>

          <div className="stats-col" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-fire stats-icon text-rose-500"></i>
            <div className="stats-num" style={{ color: 'var(--text)' }}>{stats.streak}</div>
            <div className="stats-lbl" style={{ color: 'var(--text3)' }}>بەردەوامی</div>
          </div>

          <div className="stats-col" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-bookmark stats-icon text-amber-500"></i>
            <div className="stats-num" style={{ color: 'var(--text)' }}>{stats.bookmarksCount}</div>
            <div className="stats-lbl" style={{ color: 'var(--text3)' }}>نیشانکری</div>
          </div>

          <div className="stats-col" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-ranking-star stats-icon text-indigo-500"></i>
            <div className="stats-num" style={{ color: 'var(--text)' }}>{stats.bestStreak}</div>
            <div className="stats-lbl" style={{ color: 'var(--text3)' }}>بلندترین</div>
          </div>

          <div className="stats-col" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-star stats-icon text-yellow-500"></i>
            <div className="stats-num" style={{ color: 'var(--text)' }}>{stats.completedReports}</div>
            <div className="stats-lbl" style={{ color: 'var(--text3)' }}>راپۆرت</div>
          </div>

          <div className="stats-col" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-chart-line stats-icon text-emerald-500"></i>
            <div className="stats-num" style={{ color: 'var(--text)' }}>{stats.totalActivities}</div>
            <div className="stats-lbl" style={{ color: 'var(--text3)' }}>چاڵاکی</div>
          </div>
        </div>

        {/* ── 3. APPEARANCE GROUP (Theme Grid) ── */}
        <div className="settings-group space-y-2.5">
          <div className="settings-group-title text-xs font-bold tracking-wider px-2 uppercase" style={{ color: 'var(--text3)' }}>
            شێواز
          </div>

          <div className="theme-grid">
            {themes.map(th => {
              const isSelected = themeMode === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id)}
                  className={`theme-card ${isSelected ? 'on' : ''}`}
                  style={{
                    background: 'var(--surface)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  <div className="theme-card-preview">
                    <div
                      className="theme-swatch-main"
                      style={{ background: th.bg, border: '1px solid rgba(128,128,128,.2)' }}
                    >
                      <div
                        className="theme-swatch-dot"
                        style={{ background: th.accent }}
                      />
                    </div>
                    <div className="theme-swatch-lines">
                      <div className="theme-swatch-line" style={{ background: th.surface, width: '100%' }} />
                      <div className="theme-swatch-line" style={{ background: 'rgba(128,128,128,.25)', width: '70%' }} />
                      <div className="theme-swatch-line" style={{ background: 'rgba(128,128,128,.15)', width: '50%' }} />
                    </div>
                  </div>

                  <div className="theme-card-name" style={{ color: 'var(--text)' }}>{th.name}</div>
                  <div className="theme-card-sub" style={{ color: 'var(--text3)' }}>{th.sub}</div>

                  <div className="theme-card-check" style={{ background: 'var(--accent)', color: 'var(--accent-t)' }}>
                    <i className="fas fa-check"></i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. ABOUT US GROUP (دەربارەی مە) ── */}
        <div className="settings-group space-y-1.5">
          <div className="settings-group-title text-xs font-bold tracking-wider px-2 uppercase mb-2" style={{ color: 'var(--text3)' }}>
            دەربارەی مە
          </div>

          {/* Nojdarê Zîrek Item */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setActiveSheet('app');
            }}
            className="about-nav-row s-row"
          >
            <div className="about-nav-left">
              <div className="about-nav-icon about-nav-icon--img about-nav-icon--logo">
                <img src="/logo.png" alt="نۆژدارێ زیرەک" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <div className="about-nav-label">نۆژدارێ زیرەک</div>
                <div className="about-nav-sub">دەربارەی پڕۆژەی</div>
              </div>
            </div>
            <span className="about-nav-chevron">
              <i className="fas fa-chevron-left"></i>
            </span>
          </div>

          {/* Founder Item */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setActiveSheet('founder');
            }}
            className="about-nav-row s-row"
          >
            <div className="about-nav-left">
              <div className="about-nav-icon about-nav-icon--img about-nav-icon--person">
                <img src="/image.png" alt="Hajan Salih" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <div className="about-nav-label">Hajan Salih</div>
                <div className="about-nav-sub">دامەزرێنەر و گەشەپێدەر</div>
              </div>
            </div>
            <span className="about-nav-chevron">
              <i className="fas fa-chevron-left"></i>
            </span>
          </div>

          {/* Medication Tracker Item */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              onOpenMeds?.();
            }}
            className="about-nav-row s-row"
          >
            <div className="about-nav-left">
              <div className="about-nav-icon" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
                <i className="fas fa-pills"></i>
              </div>
              <div>
                <div className="about-nav-label">بیرئانینا دەرمانان (Medication Tracker)</div>
                <div className="about-nav-sub">خشتە و چاڤدێریکرنا خوارنا دەرمانان</div>
              </div>
            </div>
            <span className="about-nav-chevron">
              <i className="fas fa-chevron-left"></i>
            </span>
          </div>

          {/* Sources Item */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setActiveSheet('sources');
            }}
            className="about-nav-row s-row"
          >
            <div className="about-nav-left">
              <div className="about-nav-icon">
                <i className="fas fa-book-medical"></i>
              </div>
              <div>
                <div className="about-nav-label">ژێدەرێن زانستی و پزیشکی</div>
                <div className="about-nav-sub">ژێدەرێن پەسەندکری</div>
              </div>
            </div>
            <span className="about-nav-chevron">
              <i className="fas fa-chevron-left"></i>
            </span>
          </div>

          {/* Thanks Item */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setActiveSheet('thanks');
            }}
            className="about-nav-row s-row"
          >
            <div className="about-nav-left">
              <div className="about-nav-icon" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>
                <i className="fas fa-heart"></i>
              </div>
              <div>
                <div className="about-nav-label">سوپاسنامە</div>
                <div className="about-nav-sub">بۆ هەر کەسەکێ هاریکاری پێشکێشکری</div>
              </div>
            </div>
            <span className="about-nav-chevron">
              <i className="fas fa-chevron-left"></i>
            </span>
          </div>
        </div>

        {/* ── 5. ABOUT FOOTER SECTION ── */}
        <div className="about-section text-center pt-3 pb-2 space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl p-1 shadow-md ring-1 ring-black/5" style={{ background: 'var(--surface)' }}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div className="about-name text-sm font-black" style={{ color: 'var(--text)' }}>نۆژدارێ زیرەک</div>
          <div className="about-ver text-[11px] font-bold tracking-wider" style={{ color: 'var(--text3)' }}>v2.3.4</div>
          <div className="about-desc text-[11px] font-semibold max-w-xs mx-auto" style={{ color: 'var(--text2)' }}>
            تێگەهشتنا تەندروستی ب زمانەکێ سادە و ب دیالێکتا بادینی
          </div>
        </div>

      </div>

      {/* ── EXACT TAFSIRKURD MODAL SHEETS (cfg-sheet) ── */}
      {typeof document !== 'undefined' && activeSheet && createPortal(
        <div
          className="cfg-sheet-overlay"
          onClick={() => {
            triggerHaptic('light');
            setActiveSheet(null);
          }}
          onTouchMove={(e) => e.preventDefault()}
          style={{ zIndex: 99998, background: 'rgba(0, 0, 0, 0.6)' }}
        >
          <div
            className="cfg-sheet"
            onClick={e => e.stopPropagation()}
            style={{
              zIndex: 99999,
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              top: 'max(56px, calc(env(safe-area-inset-top, 0px) + 12px))',
              height: 'auto',
              maxHeight: 'none',
              minHeight: 0,
              width: '100%',
              maxWidth: '100%',
              margin: 0,
              background: 'var(--bg)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
              borderRadius: '20px 20px 0 0',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              transform: `translateY(${sheetDragY}px)`,
              transition: isDraggingSheet ? 'none' : 'transform 0.28s cubic-bezier(0.32, 1, 0.56, 1)',
              paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
              touchAction: 'none'
            }}
          >
            <div
              className="cfg-sheet-pull cursor-grab active:cursor-grabbing"
              style={{ background: 'var(--border2)' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            <div
              className="cfg-sheet-hdr select-none"
              style={{ borderColor: 'var(--border)' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="cfg-sheet-title" style={{ color: 'var(--text)' }}>
                {activeSheet === 'app' && 'نۆژدارێ زیرەک'}
                {activeSheet === 'founder' && 'Hajan Salih'}
                {activeSheet === 'sources' && 'ژێدەرێن پزیشکی'}
                {activeSheet === 'thanks' && 'سوپاسنامە'}
                {activeSheet === 'profile' && 'پرۆفایل'}
              </div>
              <button
                className="cfg-sheet-close"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveSheet(null);
                }}
                style={{ background: 'var(--bg2)', color: 'var(--text2)' }}
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>

            <div className="cfg-sheet-body">
              {/* ── 1. ABOUT APP SHEET ── */}
              {activeSheet === 'app' && (
                <>
                  <div className="cfg-sheet-hero">
                    <div className="cfg-sheet-avatar" style={{ background: 'var(--bg2)', borderColor: 'var(--border)', width: 76, height: 76 }}>
                      <img src="/logo.png" alt="App Logo" />
                    </div>
                    <div className="cfg-sheet-name" style={{ color: 'var(--text)' }}>نۆژدارێ زیرەک</div>
                    <div className="cfg-sheet-role" style={{ color: 'var(--text3)' }}>پلاتفۆرمەکا زیرەکا پزیشکی ب دیالێکتا بادینی</div>
                  </div>

                  <div className="cab-section">
                    <div className="cab-sec-label" style={{ color: 'var(--accent)' }}>خزمەتگوزاری</div>
                    <div className="cab-sec-title" style={{ color: 'var(--text)' }}>ئەم چ پێشکێش دکەین</div>
                    <div className="flex flex-col gap-2.5">
                      {[
                        { num: '٠١', title: 'شیکاریا دەرمانان و هاوتایان', desc: 'دیتنا دەرمانێن هاوتا و بەدیل ل بازاڕێ کوردستانێ ب بهایەکێ گونجای و زانیاریێن دروست.' },
                        { num: '٠٢', title: 'شیکاریا نیشانێن نەخۆشیێ', desc: 'دیارکرنا نەخۆشی و ئەگەران ل دویڤ نیشانێن تە ب زمانێ شرینێ بادینی.' },
                        { num: '٠٣', title: 'خواندن و شیکاریا راپۆرتان', desc: 'شیکارکرنا وێنەیێن راپۆرتێن پزیشکی و فەحسان ب زیرەکیا دەستکرد ب بلەزی.' }
                      ].map(f => (
                        <div key={f.num} className="cab-feat" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                          <div className="cab-feat-num" style={{ color: 'var(--accent)' }}>{f.num}</div>
                          <div className="cab-feat-body">
                            <div className="cab-feat-title" style={{ color: 'var(--text)' }}>{f.title}</div>
                            <div className="cab-feat-desc" style={{ color: 'var(--text2)' }}>{f.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cab-stats">
                    <div className="cab-stat" style={{ background: 'var(--bg2)' }}>
                      <span className="cab-stat-num" style={{ color: 'var(--accent)' }}>١٠٠٪</span>
                      <span className="cab-stat-label" style={{ color: 'var(--text3)' }}>زیرەکیا دەستکرد</span>
                    </div>
                    <div className="cab-stat" style={{ background: 'var(--bg2)' }}>
                      <span className="cab-stat-num" style={{ color: 'var(--accent)' }}>٢٤/٧</span>
                      <span className="cab-stat-label" style={{ color: 'var(--text3)' }}>بەردەست بۆ هەوە</span>
                    </div>
                  </div>

                  <div className="cab-ayah-wrap" style={{ background: 'var(--bg2)', borderRightColor: 'var(--accent)' }}>
                    <div className="cab-ayah-ar" style={{ color: 'var(--text)' }}>وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ</div>
                    <div className="cab-ayah-ku" style={{ color: 'var(--text2)' }}>"و دەمێ ئەز نەخۆش دکەڤم، ئەو شیفایێ ددەتە من"</div>
                    <div className="cab-ayah-ref" style={{ color: 'var(--accent)' }}>سوڕەتا الشعراء — ٨٠</div>
                  </div>

                  <div className="cab-decl">
                    <div className="cab-decl-title" style={{ color: 'var(--text)' }}>خزمەتگوزارییا سەربەخۆ</div>
                    <div className="cab-decl-para" style={{ color: 'var(--text2)' }}>
                      ئەڤ پڕۆژەیە خزمەتگوزارییەکا سەربەخۆ و پێشکەفتی یە ژبۆ خزمەتکرنا خەلکێ هێژایێ دەڤەرا بادینان ب بێ بەرامبەر.
                    </div>
                  </div>
                </>
              )}

              {/* ── 2. ABOUT FOUNDER SHEET ── */}
              {activeSheet === 'founder' && (
                <>
                  <div className="cfg-sheet-hero">
                    <div className="cfg-sheet-avatar" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                      <img src="/image.png" alt="Hajan Salih" />
                    </div>
                    <div className="cfg-sheet-name" style={{ color: 'var(--text)' }}>Hajan Salih</div>
                    <div className="cfg-sheet-role" style={{ color: 'var(--accent)' }}>دامەزرێنەر و گەشەپێدەر</div>
                  </div>

                  <div className="cfo-section">
                    <div className="cfo-para" style={{ color: 'var(--text2)' }}>
                      گەشەپێدەرێ سیستەمێ نۆژدارێ زیرەک، ئارمانجا من پێشکێشکرنا تەکنەلۆژیایەکا مۆدێرن و ب مفا یە بۆ خزمەتکرنا جڤاکی ب دیالێکتا بادینی یا شرین.
                    </div>
                    <div className="cfo-para" style={{ color: 'var(--text2)' }}>
                      کارکرن ل سەر چێکرنا پلاتفۆرمێن زیرەک کو هاریکاریا خەلکی بکەت د تێگەهشتنا دروست یا زانیاریێن تەندروستی دا.
                    </div>
                  </div>

                  <div className="cfo-ayah" style={{ background: 'var(--bg2)', borderRightColor: 'var(--accent)' }}>
                    <div className="cfo-ayah-ar" style={{ color: 'var(--text)' }}>إِنْ أُرِيدُ إِلَّا الْإِصْلَاحَ مَا اسْتَطَعْتُ ۚ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ</div>
                    <div className="cfo-ayah-ku" style={{ color: 'var(--text2)' }}>"ئەز چ ناخوازم ژبلی چاکسازیێ هەتا من بشێت، و سەرکەفتنا من بتنێ ب دەستێ خودێ یە"</div>
                    <div className="cfo-ayah-ref" style={{ color: 'var(--accent)' }}>سوڕەتا هود — ٨٨</div>
                  </div>

                  <div className="cfo-section">
                    <div className="cab-sec-label" style={{ color: 'var(--accent)' }}>پابەندبوون</div>
                    <div className="cfo-values">
                      {[
                        { t: 'ڕازەمەندییا خودای', d: 'ئەڤ کارە بتنێ بۆ ڕازەمەندییا خودێ دهێتە ئەنجامدان. هیڤییا مە بتنێ خزمەتکرنا خەلکی و قەبویلبوونا ژلایێ خوداییە.' },
                        { t: 'خزمەتا تەندروستیێ', d: 'گەهاندنا زانیاریێن دروست و پێزانینێن ساخلەمیێ بۆ هەمی خەلکێ مە ب شێوازەکێ ڕوون و سادە و ب دیالێکتا بادینی.' },
                        { t: 'گەهاندن بۆ هەمییان', d: 'دروستکرنا پلاتفۆرمەکا زیرەک کو بەردەستە بۆ هەمی وەلاتیان ل هەر جهەکی، بێ بەرامبەر و بێ جیاوازی.' },
                        { t: 'داهێنان و پێشکەفتن', d: 'بکارئینانا نویترین تەکنەلۆژیایێن زیرەکیا دەستکرد (AI) بۆ پێشخستنا ئاستێ ساخلەمیێ و چاڤدێرییا پزیشکی.' }
                      ].map((v, i) => (
                        <div key={i} className="cfo-val-item" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                          <div className="cfo-val-title" style={{ color: 'var(--text)' }}>{v.t}</div>
                          <div className="cfo-val-desc" style={{ color: 'var(--text2)' }}>{v.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cfo-dua" style={{ background: 'var(--bg2)', borderColor: 'var(--accent)' }}>
                    <div className="cfo-dua-label" style={{ color: 'var(--accent)' }}>دوعا</div>
                    <div className="cfo-dua-title" style={{ color: 'var(--text)' }}>دوعا بۆ بینەر و بەکارهێنەرێن مە</div>
                    <div className="cfo-dua-text" style={{ color: 'var(--text2)' }}>
                      یا ڕەب شیفایێ بۆ هەمی نەخۆشان بنێری و لەش ساخی و ئارامیێ بکەیە بەشێ هەمی مالەکێ.
                    </div>
                  </div>

                  <div className="cfo-ayah" style={{ background: 'var(--bg2)', borderRightColor: 'var(--accent)' }}>
                    <div className="cfo-ayah-ar" style={{ color: 'var(--text)' }}>رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ</div>
                    <div className="cfo-ayah-ku" style={{ color: 'var(--text2)' }}>"خودایێ مە ژ مە قەبیل بکە، ب ڕاستی توو یێ گوهدار و زانایی"</div>
                    <div className="cfo-ayah-ref" style={{ color: 'var(--accent)' }}>سوڕەتا البقرة — ١٢٧</div>
                  </div>
                </>
              )}

              {/* ── 3. SOURCES SHEET ── */}
              {activeSheet === 'sources' && (
                <>
                  <div className="cab-section">
                    <div className="cab-sec-label" style={{ color: 'var(--accent)' }}>ژێدەرێن زانستی</div>
                    <div className="cab-decl-para" style={{ color: 'var(--text2)' }}>
                      هەمی داتا و شرۆڤەکرنێن نۆژدارێ زیرەک ل سەر ژێدەرێن باوەڕپێکری یێن تەندروستی یا جیهانی هاتیەنە ئاڤاکرن:
                    </div>
                  </div>

                  <div className="cab-book-card" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                    <div className="cab-book-card-badge" style={{ background: 'var(--accent)', color: 'var(--accent-t)' }}>ژێدەرێن باوەڕپێکری</div>
                    <div className="cab-book-card-title" style={{ color: 'var(--text)' }}>ستانداردێن پزیشکی یێن جیهانی</div>
                    <div className="cab-book-card-author" style={{ color: 'var(--accent)' }}>WHO • Mayo Clinic • FDA • BNF</div>
                    <div className="cab-book-card-desc" style={{ color: 'var(--text2)' }}>
                      پشکنین و شیکاریێن دەرمان و نەخۆشیان ل دویڤ پەیڕەوێن پەسەندکری یێن رێکخراوا ساخلەمییا جیهانی دهێنە رێکخستن.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold leading-relaxed">
                    ⚠️ ئاگەهداری: ئەڤ سیستەمە بۆ بەرچاوڕوونی و رێنمایی یە، ل دەمێ پێدڤی هەردەم سەرەدانا نوژدارێ تایبەتمەند بکە.
                  </div>
                </>
              )}

              {/* ── 4. THANKS SHEET ── */}
              {activeSheet === 'thanks' && (
                <>
                  <div className="cfg-sheet-hero">
                    <div className="cfg-sheet-avatar" style={{ background: 'linear-gradient(135deg, #e8445a, #ff7c95)', border: 'none', color: '#fff' }}>
                      <i className="fas fa-heart text-3xl"></i>
                    </div>
                    <div className="cfg-sheet-name" style={{ color: 'var(--text)' }}>سوپاسنامە</div>
                    <div className="cfg-sheet-role" style={{ color: 'var(--accent)' }}>بۆ هەمی دڵسۆز و پشتەڤانێن پڕۆژەی</div>
                  </div>

                  <div className="cfo-section">
                    <div className="cfo-para text-center font-bold" style={{ color: 'var(--text)' }}>
                      سوپاس و پێزانین بۆ هەمی ئەو دۆست و هەڤاڵێن ب هزر و ڕێنمایێن خۆ هاریکارییا مە کرین د پێشڤەبرنا ڤی سیستەمی دا.
                    </div>
                    <div className="cfo-para text-center text-rose-500 font-black text-base mt-2">
                      سوپاس بۆ باوەڕی و متمانەیا هەوە ❤️
                    </div>
                  </div>
                </>
              )}

              {/* ── 5. PROFILE SHEET ── */}
              {activeSheet === 'profile' && currentUser && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl space-y-2.5" style={{ background: 'var(--bg2)' }}>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: 'var(--text3)' }}>ناڤ:</span>
                      <span style={{ color: 'var(--text)' }}>{currentUser.displayName}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: 'var(--text3)' }}>ئیمێل:</span>
                      <span style={{ color: 'var(--text)' }}>{currentUser.email || currentUser.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: 'var(--text3)' }}>جۆرێ هەژمارێ:</span>
                      <span style={{ color: 'var(--accent)' }} className="font-black">{currentUser.provider || 'Google'}</span>
                    </div>
                  </div>

                  {onSignOut && (
                    <button
                      onClick={() => {
                        setActiveSheet(null);
                        onSignOut();
                      }}
                      className="w-full py-3 rounded-xl bg-rose-500 text-white font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      دەرکەفتن ژ هەژمارێ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CONFIRM DIALOG (_tkConfirm) ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {confirmDialog.icon && (
              <div className="text-4xl mx-auto mb-1 animate-bounce">
                {confirmDialog.icon}
              </div>
            )}
            <h4 className="text-base font-black leading-snug" style={{ color: 'var(--text)' }}>
              {confirmDialog.title}
            </h4>
            {confirmDialog.sub && (
              <p className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>{confirmDialog.sub}</p>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  const onYes = confirmDialog.onYes;
                  setConfirmDialog(null);
                  onYes();
                }}
                className="flex-1 py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                style={{
                  background: confirmDialog.danger ? '#ef4444' : 'var(--accent)',
                  color: confirmDialog.danger ? '#ffffff' : 'var(--accent-t)'
                }}
              >
                {confirmDialog.yes || 'بەلێ'}
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (confirmDialog.onNo) confirmDialog.onNo();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-3 rounded-xl font-black text-xs active:scale-95 transition-all"
                style={{ background: 'var(--bg2)', color: 'var(--text2)' }}
              >
                {confirmDialog.no || 'نەخێر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL PROFILE OVERLAY (TafsirKurd Style) ── */}
      {showProfile && (
        <ProfilePanel
          darkMode={darkMode}
          currentUser={currentUser}
          onBack={() => setShowProfile(false)}
          onSignOut={() => {
            setShowProfile(false);
            onSignOut?.();
          }}
        />
      )}

    </div>
  );
};

export default SettingsPanel;

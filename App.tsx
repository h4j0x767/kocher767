import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Image as ImageIcon, X, Send, ArrowRight, Instagram, Phone, Camera, Sparkles, ChevronLeft } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import LoadingScreen from './components/LoadingScreen';
import ResultDashboard from './components/ResultDashboard';
import BottomNav, { NavTab } from './components/BottomNav';
import HistoryPanel from './components/HistoryPanel';
import FavoritesPanel from './components/FavoritesPanel';
import SettingsPanel from './components/SettingsPanel';
import AboutPanel from './components/AboutPanel';
import DeveloperPanel from './components/DeveloperPanel';
import ProfilePanel from './components/ProfilePanel';
import SplashScreen from './components/SplashScreen';
import SystemIntegrationPanel from './components/SystemIntegrationPanel';
import MedicationTrackerPanel from './components/MedicationTrackerPanel';
import SkinVisionModal from './components/SkinVisionModal';
import AuthScreen from './components/AuthScreen';
import IOSNotificationToast, { ToastMessage } from './components/IOSNotificationToast';
import { IOSNotificationBanner } from './components/IOSNotificationBanner';
import IOSPermissionPrompt from './components/IOSPermissionPrompt';
import { analyzeMedicalQuery } from './services/geminiService';
import { getCurrentUser, signOut, UserProfile } from './services/authService';
import { MedicalData, AppState, HistoryItem } from './types';
import { initializeStorageEncryption } from './services/encryptionService';
import { requestNotificationPermission, notifyAnalysisReady } from './services/notificationService';

// Initialize secure storage wrapper immediately on load
initializeStorageEncryption();

// ── CSS for page transition animations ──────────────────────────
const TAB_TRANSITION_CSS = `
  @keyframes tab-slide-in  { from { transform:translateX(40px);  opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes tab-slide-out { from { transform:translateX(0);     opacity:1; } to { transform:translateX(-40px); opacity:0; } }
  @keyframes tab-fade-in   { from { opacity:0; transform:scale(0.98); } to { opacity:1; transform:scale(1); } }
  .tab-enter { animation: tab-fade-in 280ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
  .page-push-enter { animation: tab-slide-in 300ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
`;
if (typeof document !== 'undefined' && !document.getElementById('__tab-transitions__')) {
  const s = document.createElement('style');
  s.id = '__tab-transitions__';
  s.textContent = TAB_TRANSITION_CSS;
  document.head.appendChild(s);
}

// Save a query to search history
const saveToHistory = (query: string, data: MedicalData, image?: string | null) => {
  const displayQuery = query.trim() || data.name || "شیکاریێ وێنەی";
  try {
    const raw = localStorage.getItem('searchHistory') || localStorage.getItem('search_history');
    const history = raw ? JSON.parse(raw) : [];
    // Avoid duplicates
    const filtered = history.filter((h: any) => h.query !== displayQuery && h.data?.name !== data.name);
    filtered.unshift({ query: displayQuery, timestamp: Date.now(), data, image });
    // Keep last 50
    const sliced = filtered.slice(0, 50);
    localStorage.setItem('searchHistory', JSON.stringify(sliced));
    localStorage.setItem('search_history', JSON.stringify(sliced));
  } catch (e) {
    console.error('saveToHistory error:', e);
  }
};

function App() {
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<MedicalData | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [tabKey, setTabKey] = useState(0);
  const [settingsPage, setSettingsPage] = useState<'settings' | 'about' | 'developer' | 'integration' | 'profile'>('settings');
  const [subPageKey, setSubPageKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Splash Screen ──
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // ── Authentication ──
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getCurrentUser() || {
      uid: 'u_' + Date.now().toString(36),
      displayName: 'hajan salih',
      email: 'hajansalih75@gmail.com',
      provider: 'google',
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      lastLogin: Date.now(),
    };
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // ── iOS Notification Toast ──
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((title: string, body: string, type: ToastMessage['type'] = 'info') => {
    setToast({ id: String(Date.now()), title, body, type });
  }, []);

  // Request notifications permission on load
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system' | 'noor' | 'sakina'>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('themeMode') || localStorage.getItem('theme')) as any;
      if (saved) return saved;
    }
    return 'sakina';
  });

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = themeMode;
      const isDark = currentTheme === 'dark' ||
        (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDarkMode(isDark);
      document.documentElement.setAttribute('data-theme', currentTheme);
      
      const bgMap: Record<string, string> = {
        dark: '#0a0a0a',
        sakina: '#0c1c12',
        noor: '#f4e8cc',
        light: '#fafafa'
      };
      const bg = bgMap[currentTheme] || (isDark ? '#0a0a0a' : '#f4e8cc');
      document.documentElement.style.background = bg;
      document.documentElement.style.backgroundColor = bg;
      document.documentElement.style.colorScheme = (currentTheme === 'dark' || currentTheme === 'sakina') ? 'dark' : 'light';
      document.documentElement.style.setProperty('--bg', bg);
      if (document.body) {
        document.body.style.background = bg;
        document.body.style.backgroundColor = bg;
      }
      const meta = document.getElementById('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', bg);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', currentTheme);
      localStorage.setItem('themeMode', currentTheme);
    };

    handleThemeChange();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => handleThemeChange();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Counts for badges
  const [historyCount, setHistoryCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [medsCount, setMedsCount] = useState(0);

  const refreshCounts = () => {
    try {
      setHistoryCount(JSON.parse(localStorage.getItem('searchHistory') || '[]').length);
      setFavoritesCount(JSON.parse(localStorage.getItem('favorites') || '[]').length);
      const meds = JSON.parse(localStorage.getItem('dr_badini_medications') || '[]');
      const todayKey = new Date().toISOString().split('T')[0];
      let pending = 0;
      meds.forEach((m: any) => {
        if (!m.active) return;
        m.times?.forEach((t: string) => {
          if (!m.takenHistory?.[`${todayKey}_${t}`]) pending++;
        });
      });
      setMedsCount(pending);
    } catch {}
  };

  // Live Skin Vision Modal state
  const [showSkinVision, setShowSkinVision] = useState(false);

  const handleAddMedicationFromOintment = (med: { name: string; dosage: string; type: any; notes: string }) => {
    try {
      const saved = localStorage.getItem('dr_badini_medications');
      const currentList = saved ? JSON.parse(saved) : [];
      const newMedItem = {
        id: 'med_' + Date.now().toString(36),
        name: med.name,
        dosage: med.dosage || 'چینەکا تەنک',
        type: med.type || 'cream',
        times: ['10:00', '22:00'],
        timeSlots: ['morning', 'night'],
        foodRelation: 'none',
        color: '#10b981',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
        notes: med.notes || 'مەرهەمێ پێشنیارکری یێ پێستی',
        startDate: Date.now(),
        totalDays: 7,
        active: true,
        takenHistory: {},
      };
      const updated = [newMedItem, ...currentList];
      localStorage.setItem('dr_badini_medications', JSON.stringify(updated));
      refreshCounts();
    } catch (e) {
      console.warn('Failed to add ointment to meds storage:', e);
    }
  };

  useEffect(() => { refreshCounts(); }, [activeTab]);

  const performAnalysis = async (searchQuery: string, image?: string | null) => {
    setAppState(AppState.LOADING);
    showToast('دەستپێکرنا شیکاریێ', 'سیستەمێ AI یێ دەست ب شیکاریێ دکەت...', 'ai');
    try {
      const result = await analyzeMedicalQuery(searchQuery, image ? image : undefined);
      setData(result);
      setAppState(AppState.SUCCESS);
      saveToHistory(searchQuery, result, image);
      refreshCounts();
      showToast('شیکاری ب سەرکەفتی تەواو بوو', result.name || 'راپۆرتا پزیشکی ئامادەیە', 'success');
      notifyAnalysisReady(result.name || 'شیکاریێ نوێ').catch(() => {});
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      showToast('ئاریشەک چێبوو', 'نەشیام شیکاریێ تەواو بکەم. دووبارە هەوڵ بدە.', 'alert');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    if (urlQuery && urlQuery.trim()) {
      setQuery(urlQuery);
      performAnalysis(urlQuery);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim() && !selectedImage) return;
    if (query.trim()) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url.toString());
      } catch (e) {
        console.warn('Could not update URL:', e);
      }
    }
    await performAnalysis(query, selectedImage);
  };

  const handleBack = () => {
    setAppState(AppState.IDLE);
    setQuery('');
    setSelectedImage(null);
    setData(null);
    setActiveTab('home');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('Could not clear URL:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        performAnalysis(query, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // ── SPLASH SCREEN ──
  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  // ── LOADING ──
  if (appState === AppState.LOADING) {
    return <LoadingScreen imageUrl={selectedImage} />;
  }

  // ── RESULT ──
  if (appState === AppState.SUCCESS && data) {
    return (
      <ResultDashboard
        data={data}
        onBack={handleBack}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // ── ABOUT (old page, now accessed from Settings) ──
  if (appState === AppState.ABOUT) {
    return (
      <div className="min-h-screen bg-slate-50/50 md:py-12 flex justify-center dir-rtl" dir="rtl">
        <div className="bg-white/95 backdrop-blur-2xl w-full min-h-screen md:min-h-0 md:max-w-md md:rounded-[3rem] md:shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-12 duration-500 flex flex-col border border-slate-100/80">
          <div className="h-80 relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900">
            <img src="/medical_app_hero_young_couple_1770678488845.png" alt="Hero"
              className="w-full h-full object-cover object-top opacity-95 transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-slate-900/10 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 to-transparent"></div>
            <button onClick={() => setAppState(AppState.IDLE)}
              className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-slate-800 transition-all hover:bg-slate-100 active:scale-90 z-20 border border-slate-100">
              <ArrowRight size={22} className="rotate-180" />
            </button>
          </div>
          <div className="px-8 pb-12 flex flex-col items-center">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-4 mb-6"></div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">دەربارەی پڕۆژەی</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full mb-8"></div>
            <div className="text-slate-600 font-semibold leading-relaxed text-center mb-10 px-2 max-w-md text-base">
              <p>ئەڤ پڕۆژەیە بەرهەمێ هەول و ماندووبوونا مە وەک قوتابیێن پشكا سیستەمێن کۆمپیۆتەری یە.</p>
            </div>
            <div className="w-full space-y-6 mb-8">
              <div className="bg-gradient-to-l from-rose-50/40 to-white border border-rose-100/50 p-5 rounded-3xl flex items-center gap-5 shadow-sm">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-rose-50 shrink-0 ring-4 ring-rose-500/10">
                  <img src="/teacher_avatar.png" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-100/30">سەرپەرشتا پڕۆژەی</span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1.5">مامۆستا زینە بیبۆ</h3>
                </div>
              </div>
              <div className="bg-gradient-to-l from-blue-50/40 to-white border border-blue-100/50 p-5 rounded-3xl flex items-center gap-5 shadow-sm">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-blue-50 shrink-0 ring-4 ring-blue-500/10">
                  <img src="/student_avatar.png" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-100/30">قوتابی</span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1.5">Hajan Salih</h3>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-6 w-full mt-6 px-4">
              <button className="flex flex-col items-center gap-2.5 flex-1 transition-all duration-300 active:scale-95 group">
                <div className="relative p-0.5 rounded-[2rem] bg-gradient-to-br from-sky-400 to-blue-600 shadow-md shadow-sky-100/50 group-hover:shadow-lg transition-all duration-300">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-[1.9rem] flex items-center justify-center text-sky-500 group-hover:text-blue-600 transition-colors">
                    <Send size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-400 group-hover:text-sky-600 transition-colors">تێلیگرام</span>
              </button>
              <button className="flex flex-col items-center gap-2.5 flex-1 transition-all duration-300 active:scale-95 group">
                <div className="relative p-0.5 rounded-[2rem] bg-gradient-to-br from-rose-400 via-fuchsia-500 to-purple-600 shadow-md shadow-rose-100/50 group-hover:shadow-lg transition-all duration-300">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-[1.9rem] flex items-center justify-center text-rose-500 group-hover:text-fuchsia-600 transition-colors">
                    <Instagram size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-400 group-hover:text-rose-600 transition-colors">ئینستاگرام</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN SHELL (with Bottom Nav + smooth transitions) ──
  return (
    <div
      className="min-h-screen transition-colors duration-200 font-sans"
      style={{
        background: 'var(--bg)',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        minHeight: '100dvh',
      }}
      dir="rtl"
    >

      {/* ── Dynamic iOS Notification Toast ── */}
      <IOSNotificationToast toast={toast} onDismiss={() => setToast(null)} />

      {/* ── Tab: MEDS (Smart Medication Tracker) ── */}
      {activeTab === 'meds' && (
        <div key={`meds-${tabKey}`} className="tab-enter">
          <MedicationTrackerPanel
            darkMode={darkMode}
            showToast={showToast}
            onModalStateChange={setIsMedModalOpen}
            onOpenMedicationDetails={(medName) => {
              setQuery(medName);
              setTabKey(k => k + 1);
              setActiveTab('home');
              performAnalysis(medName);
            }}
          />
        </div>
      )}

      {/* ── Tab: HISTORY ── */}
      {activeTab === 'history' && (
        <div key={`history-${tabKey}`} className="tab-enter">
          <HistoryPanel
            darkMode={darkMode}
            onSelectQuery={(q) => {
              setQuery(q);
              setTabKey(k => k + 1);
              setActiveTab('home');
              performAnalysis(q);
            }}
          />
        </div>
      )}

      {/* ── Tab: FAVORITES ── */}
      {activeTab === 'favorites' && (
        <div key={`favorites-${tabKey}`} className="tab-enter">
          <FavoritesPanel
            darkMode={darkMode}
            onSelectFavorite={(_item) => {
              setTabKey(k => k + 1);
              setActiveTab('home');
            }}
          />
        </div>
      )}

      {/* ── Tab: SETTINGS ── */}
      {activeTab === 'settings' && settingsPage === 'settings' && (
      <div key={`settings-${tabKey}`} className="tab-enter">
          <SettingsPanel 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            themeMode={themeMode} 
            setThemeMode={setThemeMode}
            currentUser={currentUser}
            onModalStateChange={setIsSettingsModalOpen}
            onSignOut={() => {
              signOut();
              setCurrentUser(null);
              showToast('دەرکەفتن', 'توو ب سەرکەفتی دەرکەفتی', 'info');
            }}
            onOpenProfile={() => { setSubPageKey(k => k + 1); setSettingsPage('profile'); }}
            onOpenLogin={() => setShowAuthModal(true)}
            onOpenMeds={() => { setTabKey(k => k + 1); setActiveTab('meds'); }}
            onOpenAbout={() => { setSubPageKey(k => k + 1); setSettingsPage('about'); }}
            onOpenDeveloper={() => { setSubPageKey(k => k + 1); setSettingsPage('developer'); }}
            onOpenIntegration={() => { setSubPageKey(k => k + 1); setSettingsPage('integration'); }}
          />
        </div>
      )}

      {/* ── Settings Sub-page: PROFILE (push animation) ── */}
      {activeTab === 'settings' && settingsPage === 'profile' && (
        <div key={`profile-${subPageKey}`} className="page-push-enter">
          <ProfilePanel
            darkMode={darkMode}
            currentUser={currentUser}
            onBack={() => setSettingsPage('settings')}
            onUserUpdated={(updated) => setCurrentUser(updated)}
            onSignOut={() => {
              signOut();
              setCurrentUser(null);
              setSettingsPage('settings');
              showToast('دەرکەفتن', 'توو ب سەرکەفتی دەرکەفتی', 'info');
            }}
          />
        </div>
      )}

      {/* ── Settings Sub-page: ABOUT (push animation) ── */}
      {activeTab === 'settings' && settingsPage === 'about' && (
        <div key={`about-${subPageKey}`} className="page-push-enter">
          <AboutPanel darkMode={darkMode} onBack={() => setSettingsPage('settings')} />
        </div>
      )}

      {/* ── Settings Sub-page: DEVELOPER (push animation) ── */}
      {activeTab === 'settings' && settingsPage === 'developer' && (
        <div key={`developer-${subPageKey}`} className="page-push-enter">
          <DeveloperPanel darkMode={darkMode} onBack={() => setSettingsPage('settings')} />
        </div>
      )}

      {/* ── Settings Sub-page: INTEGRATION (push animation) ── */}
      {activeTab === 'settings' && settingsPage === 'integration' && (
        <div key={`integration-${subPageKey}`} className="page-push-enter">
          <SystemIntegrationPanel darkMode={darkMode} onBack={() => setSettingsPage('settings')} />
        </div>
      )}

      {/* ── Tab: HOME (Apple Health iOS Design) ── */}
      {activeTab === 'home' && (
        <div
          key={`home-${tabKey}`}
          className="min-h-screen flex flex-col items-center px-4 pb-20 relative overflow-x-hidden tab-enter"
          style={{
            minHeight: '100dvh',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          }}
        >
          {/* iOS Inset Container */}
          <div className="w-full max-w-md z-10 flex flex-col items-center text-center gap-4">

            {/* Centered Brand Title & Subtitle */}
            <div className="w-full flex flex-col items-center justify-center text-center pt-2 pb-1">
              <h1
                className="text-2xl md:text-3xl font-black tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                نۆژدارێ زیرەک
              </h1>
              <p
                className="text-xs font-semibold mt-1 max-w-sm leading-relaxed"
                style={{ color: 'var(--text2)' }}
              >
                شیکارکرنا دەرمانان، نیشانێن نەخۆشیێ و راپۆرتێن نوژداری
                <br />
                ب زمانەکێ سادە و ب دیالێکتا شرینا بادینی ب زیرەکیا دەستکرد
              </p>
            </div>

            {/* iOS 18 Search & Scan Capsule (Theme Adaptive) */}
            <div className="w-full relative group">
              <div
                className="w-full rounded-[1.75rem] border overflow-hidden transition-all duration-300"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                }}
              >
                {/* Image preview */}
                {selectedImage && (
                  <div className="relative w-full h-36 border-b" style={{ borderColor: 'var(--border)' }}>
                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/15"></div>
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all active:scale-90 border"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* Text input */}
                <div className="flex items-center px-4 py-3.5">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="نیشانێن نەخۆشیێ یان ناڤێ دەرمانی..."
                    className="flex-1 bg-transparent text-sm font-bold focus:outline-none py-1 text-right"
                    style={{
                      color: 'var(--text)',
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="h-px mx-4" style={{ background: 'var(--border)' }}></div>

                {/* Action bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

                  <button
                    onClick={triggerFileInput}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-200 font-bold text-xs active:scale-95 border"
                    style={{
                      background: selectedImage ? 'var(--bg3)' : 'var(--bg2)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    <ImageIcon size={15} style={{ color: 'var(--accent)' }} />
                    <span>{selectedImage ? 'وێنە هاتە هەڵبژارتن' : 'پشکنینا وێنەی'}</span>
                  </button>

                  <button
                    onClick={handleSearch}
                    disabled={!query.trim() && !selectedImage}
                    className="flex items-center gap-2 rounded-xl px-5 py-2 font-black text-xs transition-all duration-200 active:scale-95 border"
                    style={{
                      background: (!query.trim() && !selectedImage) ? 'var(--bg3)' : 'var(--accent)',
                      color: (!query.trim() && !selectedImage) ? 'var(--text3)' : 'var(--accent-t)',
                      borderColor: (!query.trim() && !selectedImage) ? 'var(--border)' : 'transparent',
                      cursor: (!query.trim() && !selectedImage) ? 'not-allowed' : 'pointer',
                      opacity: (!query.trim() && !selectedImage) ? 0.6 : 1,
                      boxShadow: (!query.trim() && !selectedImage) ? 'none' : '0 4px 14px rgba(0,0,0,0.12)',
                    }}
                  >
                    <Send size={13} className={query.trim() || selectedImage ? 'animate-pulse' : ''} />
                    <span>شیکارکرن</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Apple iOS Live Skin Vision Feature Banner ── */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(25);
                setShowSkinVision(true);
              }}
              className="w-full p-4 rounded-[1.75rem] border shadow-xs transition-all duration-300 active:scale-98 flex items-center justify-between group cursor-pointer"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3.5 text-right">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 shrink-0"
                  style={{
                    background: 'var(--bg2)',
                    borderColor: 'var(--border)',
                    color: 'var(--accent)',
                  }}
                >
                  <Camera size={22} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black" style={{ color: 'var(--text)' }}>
                      پشکنینا پێست، برین و زیپکان
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text3)' }}>
                    شیکارکرنا دەستبەجێ یا هەوکردن و برینان ب کامیرێ
                  </p>
                </div>
              </div>

              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:-translate-x-1 shrink-0"
                style={{ borderColor: 'var(--border)', color: 'var(--text2)', background: 'var(--bg2)' }}
              >
                <ChevronLeft size={16} />
              </div>
            </button>

            {/* Error Message */}
            {appState === AppState.ERROR && (
              <div className="w-full p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/30 rounded-2xl text-xs shadow-xs text-right">
                <p className="font-black text-red-500 dark:text-red-400 mb-0.5">ئاریشەک چێبوو!</p>
                <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">ببورە، نەشیام پەیوەندیێ ب دکتۆری بکەم. هیڤیە دووبارە بکە.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Navigation Bar (Hidden when on sub-page or modal is open) ── */}
      {!(activeTab === 'settings' && settingsPage !== 'settings') && !showAuthModal && !showSkinVision && !isMedModalOpen && !isSettingsModalOpen && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setTabKey(k => k + 1); // trigger fresh animation on every tab switch
            setActiveTab(tab);
            setSettingsPage('settings');
            refreshCounts();
          }}
          medsCount={medsCount}
          historyCount={historyCount}
          favoritesCount={favoritesCount}
        />
      )}

      {/* ── AUTH MODAL (TafsirKurd Style) ── */}
      {showAuthModal && (
        <AuthScreen
          darkMode={darkMode}
          onAuthenticated={(u) => {
            setCurrentUser(u);
            setShowAuthModal(false);
            showToast('چووناژوور', 'ب خێر بێی ' + (u.displayName || ''), 'success');
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* ── LIVE SKIN VISION MODAL (iPhone Camera AI Vision) ── */}
      <SkinVisionModal
        isOpen={showSkinVision}
        onClose={() => setShowSkinVision(false)}
        darkMode={darkMode}
        showToast={showToast}
        onAddMedicationFromOintment={handleAddMedicationFromOintment}
      />

      {/* ── NATIVE IOS MEDICATION NOTIFICATION BANNER ── */}
      <IOSNotificationBanner
        onOpenMedication={() => {
          setActiveTab('meds');
        }}
      />

      {/* ── EXPLICIT IOS PERMISSION PROMPT DIALOG ── */}
      <IOSPermissionPrompt showToast={showToast} />
    </div>
  );
}

export default App;
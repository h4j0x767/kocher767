import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Cpu, Activity, Shield, Calendar, Heart, Moon,
  TrendingUp, Sparkles, MapPin, Clock, CheckCircle2, Lock,
  Fingerprint, Sparkle, RefreshCw, Star, Check, AlertCircle, ChevronRight
} from 'lucide-react';
import {
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  getBiometricCapability
} from '../services/biometricService';
import { migrateDatabaseEncryption } from '../services/encryptionService';

interface SystemIntegrationPanelProps {
  onBack: () => void;
  darkMode: boolean;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  timeSlot: string;
  stars: number;
  phone: string;
  specialtyKey: 'cardio' | 'pedia' | 'derma' | 'internal';
}

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'active' | 'completed';
}

const SystemIntegrationPanel: React.FC<SystemIntegrationPanelProps> = ({ onBack, darkMode }) => {
  const [activeTab, setActiveTab] = useState<'wearable' | 'doctors' | 'security'>('wearable');
  
  // ── Wearable States ──
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'connected'>(() => {
    try {
      const saved = localStorage.getItem('__dr_badini_wearable_data__');
      return saved ? 'connected' : 'idle';
    } catch {
      return 'idle';
    }
  });
  const [syncProgress, setSyncProgress] = useState(0);
  const [wearableData, setWearableData] = useState<{
    steps: number;
    heartRate: number;
    sleep: number;
    oxygen: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('__dr_badini_wearable_data__');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── Doctor Booking States ──
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('__dr_badini_appointments__');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Security States ──
  const [isEncrypted, setIsEncrypted] = useState(() => {
    return localStorage.getItem('__dr_badini_aes_encrypted__') === '1';
  });
  const [encrypting, setEncrypting] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    getBiometricCapability().then(cap => {
      setBiometricSupported(cap.available);
      setBiometricEnabled(isBiometricLockEnabled());
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('__dr_badini_appointments__', JSON.stringify(appointments));
    } catch {}
  }, [appointments]);

  // ── Wearable Sync Logic ──
  const handleStartSync = () => {
    setSyncStatus('syncing');
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus('connected');
          const mockData = {
            steps: 7420,
            heartRate: 74,
            sleep: 85,
            oxygen: 98
          };
          setWearableData(mockData);
          try {
            localStorage.setItem('__dr_badini_wearable_data__', JSON.stringify(mockData));
          } catch {}
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // ── Doctor Booking Data ──
  const doctors: Doctor[] = [
    { id: '1', name: 'د. ئاراس دەلال', specialty: 'دکتۆرێ پسپۆر یێ دل و دەماران', specialtyKey: 'cardio', location: 'دهۆک - سەنتەرێ باژێڕی', timeSlot: '٤:٠٠ ئێڤاری - ٨:٠٠ شەڤ', stars: 4.9, phone: '+964 750 123 4567' },
    { id: '2', name: 'د. لەیلا کوردی', specialty: 'پسپۆرا نەخۆشیێن زارۆکان', specialtyKey: 'pedia', location: 'زاخۆ - جادەیا گشتی', timeSlot: '٣:٠٠ ئێڤاری - ٧:٠٠ ئێڤاری', stars: 4.8, phone: '+964 750 987 6543' },
    { id: '3', name: 'د. سەربەست دوسکی', specialty: 'پسپۆرێ نەخۆشیێن پێستی و جوانکاریێ', specialtyKey: 'derma', location: 'دهۆک - جادەیا KRO', timeSlot: '٢:٠٠ ئێڤاری - ٦:٠٠ ئێڤاری', stars: 4.7, phone: '+964 750 555 1234' },
    { id: '4', name: 'د. دیار زێباری', specialty: 'پسپۆرێ نەخۆشیێن هەناوی و گشتی', specialtyKey: 'internal', location: 'دهۆک - بەرامبەر نەخۆشخانا تەنگاڤیان', timeSlot: '٥:٠٠ ئێڤاری - ٩:٠٠ شەڤ', stars: 4.9, phone: '+964 750 444 8899' },
  ];

  const filteredDoctors = selectedSpecialty === 'all'
    ? doctors
    : doctors.filter(d => d.specialtyKey === selectedSpecialty);

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor || !bookingDate || !bookingTime) return;

    const newAppt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      doctorName: bookingDoctor.name,
      specialty: bookingDoctor.specialty,
      date: bookingDate,
      time: bookingTime,
      status: 'active'
    };

    setAppointments([newAppt, ...appointments]);
    setBookingDoctor(null);
    setBookingDate('');
    setBookingTime('');
  };

  const cancelAppointment = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
  };

  // ── Encryption Logic ──
  const handleToggleEncryption = () => {
    if (isEncrypted) {
      migrateDatabaseEncryption(false);
      setIsEncrypted(false);
      localStorage.setItem('__dr_badini_aes_encrypted__', '0');
    } else {
      setEncrypting(true);
      setTimeout(() => {
        setEncrypting(false);
        migrateDatabaseEncryption(true);
        setIsEncrypted(true);
        localStorage.setItem('__dr_badini_aes_encrypted__', '1');
      }, 2500);
    }
  };

  const handleToggleBiometric = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setBiometricLockEnabled(checked);
    setBiometricEnabled(checked);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300" dir="rtl">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 px-4 py-4.5 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 font-bold text-xs"
        >
          <ArrowRight size={14} />
          <span>زڤڕین</span>
        </button>
        <h2 className="text-base font-black text-slate-800 dark:text-slate-100">یەکخستنا تەکنیکی</h2>
        <div className="w-[70px]"></div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {/* Decorative dynamic cards */}
        <div className="relative p-5 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 text-white overflow-hidden shadow-lg shadow-indigo-500/15">
          <div className="absolute top-[-30%] right-[-10%] w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-300 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">نووترین ستانداردێن نوژداری</span>
            </div>
            <h3 className="text-xl font-black leading-snug">سیستەمێ گرێدانا هۆشمەند</h3>
            <p className="text-xs text-indigo-100/90 font-semibold leading-relaxed">
              گرێدانا ئەپڵیکەیشنێ دگەل کاژێرا دەستی، تۆمارکرنا تۆرنێن دکتۆران ل دەڤەرێ، و تەشفیرکرنا مۆبایلێ ب ستانداردا پاراستنا AES-256.
            </p>
          </div>
        </div>

        {/* ── TAB BUTTONS (Navigation) ── */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/20">
          {[
            { id: 'wearable', label: 'ئامێرێن زیرەک', icon: Activity },
            { id: 'doctors', label: 'نوژدارێن مە', icon: Calendar },
            { id: 'security', label: 'پاراستن', icon: Shield }
          ].map(t => {
            const ActiveIcon = t.icon;
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all duration-200 font-black text-[10px] md:text-xs text-center
                  ${isTabActive
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <ActiveIcon size={16} className={isTabActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : ''} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── CONTENT PANELS ── */}
        
        {/* ── 1. WEARABLE SYNC ── */}
        {activeTab === 'wearable' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {syncStatus === 'idle' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs text-center space-y-5">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-[1.8rem] flex items-center justify-center mx-auto ring-4 ring-indigo-500/5">
                  <Cpu size={28} className="text-indigo-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-base">گرێدان ب کاژێرا زیرەک</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-relaxed px-4">
                    پلپشتا لێدانا دلی، پێنگاڤ، خەو، و رێژا ئۆکسجینێ ژ Apple Health یان Google Fit وەرگرە.
                  </p>
                </div>
                <button
                  onClick={handleStartSync}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl font-black text-xs shadow-md shadow-indigo-500/10 active:scale-95 transition-all"
                >
                  گرێدان و هاوسەنگکرن (Sync Now)
                </button>
              </div>
            )}

            {syncStatus === 'syncing' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-950 rounded-full" />
                  <div 
                    className="absolute inset-0 border-4 border-indigo-500 rounded-full transition-all duration-200"
                    style={{
                      clipPath: `polygon(50% 50%, -50% -50%, ${syncProgress >= 25 ? '150% -50%' : '50% -50%'}, ${syncProgress >= 50 ? '150% 150%' : '50% -50%'}, ${syncProgress >= 75 ? '-50% 150%' : '50% -50%'}, ${syncProgress >= 100 ? '-50% -50%' : '50% -50%'})`
                    }}
                  />
                  <RefreshCw size={24} className="text-indigo-500 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">ل هیڤیێ بە...</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">گواستنەوە و وەرگرتنا داتا ل کاژێرێ: {syncProgress}%</p>
                </div>
              </div>
            )}

            {syncStatus === 'connected' && wearableData && (
              <div className="space-y-4">
                {/* Visual Grid Metrics */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-white dark:bg-slate-900 p-4.5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
                        <TrendingUp size={16} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">چالاک</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">پێنگاڤێن رۆژانە</p>
                      <h5 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{wearableData.steps.toLocaleString()}</h5>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4.5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl animate-pulse">
                        <Heart size={16} />
                      </div>
                      <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">ئارام</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">لێدانا دلی (BPM)</p>
                      <h5 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{wearableData.heartRate}</h5>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4.5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
                        <Moon size={16} />
                      </div>
                      <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">ئارام</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">ئاستێ خەوێ</p>
                      <h5 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{wearableData.sleep}%</h5>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4.5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="p-2 bg-sky-50 dark:bg-sky-950/30 text-sky-500 rounded-xl">
                        <Activity size={16} />
                      </div>
                      <span className="text-[10px] font-black text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">ئاسایی</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">رێژا ئۆکسجینێ SpO2</p>
                      <h5 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{wearableData.oxygen}%</h5>
                    </div>
                  </div>
                </div>

                {/* AI correlation feedback card */}
                <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-5 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-900/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Sparkle size={14} className="animate-spin" />
                    <h6 className="text-xs font-black">پێشبینیا زیرەکیا دەستکرد ژ کاژێرێ</h6>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed text-right">
                    نمرەیا خەوا تە یا باشە ({wearableData.sleep}%) و لێدانا دلی یا تەبایی ({wearableData.heartRate} bpm) د ئاستەکێ زۆر باش دا نە. ئەڤە نیشانێ ساخلەمییا دل و دەمارانە و بەرگرییا چەستەیی بهێز دکەت.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSyncStatus('idle');
                    setWearableData(null);
                    try {
                      localStorage.removeItem('__dr_badini_wearable_data__');
                    } catch {}
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs transition-all active:scale-95"
                >
                  پچڕاندنا پەیوەندیێ
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 2. DOCTOR BOOKING & DIRECTORY ── */}
        {activeTab === 'doctors' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
              {[
                { id: 'all', label: 'هەمی' },
                { id: 'cardio', label: 'دل و دەمار' },
                { id: 'pedia', label: 'زارۆک' },
                { id: 'derma', label: 'پێست' },
                { id: 'internal', label: 'هەناوی' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedSpecialty(opt.id)}
                  className={`px-4 py-2 rounded-full font-black text-[10px] whitespace-nowrap transition-all duration-200
                    ${selectedSpecialty === opt.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Doctors List */}
            {!bookingDoctor && (
              <div className="space-y-3">
                {filteredDoctors.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-900 p-4.5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex justify-between items-start gap-3"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">{doc.name}</h4>
                        <div className="flex items-center text-amber-500 gap-0.5">
                          <Star size={11} fill="currentColor" />
                          <span className="text-[10px] font-black">{doc.stars}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black">{doc.specialty}</p>
                      
                      <div className="space-y-1 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={11} className="shrink-0" />
                          <span>{doc.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="shrink-0" />
                          <span>{doc.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setBookingDoctor(doc)}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-[10px] transition-all active:scale-95 self-center shrink-0"
                    >
                      گرتنا تۆرنێ
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Booking Form Overlay / Screen */}
            {bookingDoctor && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">گرتنا تۆرنێ (حجز) ل دەڤ:</h4>
                  <button
                    onClick={() => setBookingDoctor(null)}
                    className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    پاشگەزبوون
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h5 className="font-black text-slate-800 dark:text-slate-100 text-sm">{bookingDoctor.name}</h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{bookingDoctor.specialty}</p>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500">هەلبژاردنا رۆژێ</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500">هەلبژاردنا دەمژمێرێ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['٥:٠٠ ئێڤاری', '٥:٣٠ ئێڤاری', '٦:٠٠ ئێڤاری', '٦:٣٠ ئێڤاری', '٧:٠٠ ئێڤاری', '٧:٣٠ ئێڤاری'].map(t => {
                        const isSelected = bookingTime === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setBookingTime(t)}
                            className={`p-2.5 rounded-xl text-center text-[10px] font-bold border transition-all active:scale-95
                              ${isSelected
                                ? 'bg-indigo-600 text-white border-transparent'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800'}`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!bookingDate || !bookingTime}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs text-white shadow-md transition-all active:scale-95
                      ${(!bookingDate || !bookingTime)
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-500/10'}`}
                  >
                    پەسەندکرنا تۆرنێ (Confirm Booking)
                  </button>
                </form>
              </div>
            )}

            {/* Active Booked Tickets */}
            {appointments.length > 0 && (
              <div className="space-y-3 pt-2">
                <h5 className="font-black text-slate-800 dark:text-slate-100 text-xs">تۆرنێن من یێن چالاک:</h5>
                {appointments.map(appt => (
                  <div
                    key={appt.id}
                    className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-4.5 rounded-[2rem] border border-indigo-900/35 shadow-xs text-white overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-tr-none rounded-bl-[1.5rem]">
                      تۆمارکری
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <h6 className="font-black text-sm">{appt.doctorName}</h6>
                        <p className="text-[10px] text-indigo-300 font-bold">{appt.specialty}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 border-t border-white/10 pt-2.5">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{appt.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{appt.time}</span>
                        </div>
                        <button
                          onClick={() => cancelAppointment(appt.id)}
                          className="text-rose-400 hover:text-rose-300 font-bold underline"
                        >
                          رەتکرن
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. SECURITY & AES-256 ENCRYPTION ── */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Encryption Toggle card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center relative
                ${isEncrypted ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'}`}>
                {encrypting ? (
                  <RefreshCw size={26} className="animate-spin text-indigo-500" />
                ) : isEncrypted ? (
                  <Shield size={28} className="text-emerald-500 animate-pulse" />
                ) : (
                  <Lock size={28} className="text-rose-500" />
                )}
                {encrypting && (
                  <div className="absolute inset-0 rounded-[1.8rem] border-2 border-indigo-500 animate-ping" />
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  {encrypting ? 'تەشفیرکرن...' : isEncrypted ? 'داتابەیس تەشفیرکری یە (AES-256)' : 'داتابەیس نە تەشفیرکری یە'}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed px-4">
                  تەشفیرکردن هەمی فایلا پشکنینا ل سەر ئامێرا تە ل دیڤ ستانداردا جیهانی پاریزراو دکەت.
                </p>
              </div>

              <button
                onClick={handleToggleEncryption}
                disabled={encrypting}
                className={`w-full py-3 rounded-2xl font-black text-xs text-white transition-all active:scale-95 shadow-sm
                  ${encrypting
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : isEncrypted
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'}`}
              >
                {encrypting ? 'ل هیڤیێ بە...' : isEncrypted ? 'ناچالاککرنا تەشفیرێ' : 'چالاککرنا تەشفیرکرنێ'}
              </button>
            </div>

            {/* Biometric Toggle Switch */}
            {biometricSupported && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs flex justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                    <Fingerprint size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xs">قوفلا بیۆمتریک (Face ID / Fingerprint)</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">پێدڤیکردنا پەنجەمۆرێ ل دەسپێکا ئەپی</span>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={biometricEnabled}
                    onChange={handleToggleBiometric}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full dark:bg-slate-800 peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
                </label>
              </div>
            )}

            {/* Security Logs list */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3">
              <h5 className="font-black text-slate-800 dark:text-slate-100 text-xs">سجلێ چالاکیێن ساخلەمیێ:</h5>
              <div className="space-y-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>تەشفیرکرنا جۆرێ AES-256 د ئاستەکێ زۆر چالاک دا نیشان ددەت.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>سیستەمێ بیومتریکێ ئامادەکرن بۆ دەروازێ پشتڕاستبوونێ.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>هەمی پشکنینێن پاشەکەفتی ل سەر داتابەیسا مۆبایلێ قوفلکری نە.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Credit */}
        <p className="text-center text-[10px] font-bold text-slate-300 dark:text-slate-700 pt-4">
          سیستەمێ یەکخستنێ پێشەکەفتی · دکتۆرێ زیرەک ٢٠٢٦
        </p>

      </div>
    </div>
  );
};

export default SystemIntegrationPanel;

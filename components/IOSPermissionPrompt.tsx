import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Check, Sparkles, X } from 'lucide-react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  playNotificationChime,
  triggerNotificationHaptic,
  scheduleNotification,
} from '../services/notificationService';

interface IOSPermissionPromptProps {
  onDismiss?: () => void;
  showToast?: (title: string, body: string, type?: 'success' | 'error' | 'info') => void;
}

export const IOSPermissionPrompt: React.FC<IOSPermissionPromptProps> = ({
  onDismiss,
  showToast,
}) => {
  const [permission, setPermission] = useState<string>('prompt');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  useEffect(() => {
    // Check current permission
    getNotificationPermission().then((p) => {
      setPermission(p);
      const dismissed = localStorage.getItem('dr_badini_notif_prompt_dismissed');
      if (p !== 'granted' && !dismissed) {
        setIsVisible(true);
      }
    });
  }, []);

  if (!isVisible || permission === 'granted') return null;

  const handleRequest = async () => {
    setIsActivating(true);
    triggerNotificationHaptic();
    try {
      const res = await requestNotificationPermission();
      setPermission(res);

      if (res === 'granted') {
        playNotificationChime();
        triggerNotificationHaptic();
        await scheduleNotification({
          title: 'نۆژدارێ زیرەک',
          body: 'زەنگ و نۆتیفیکەیشنا دەرمانان ب دروستی هاتە چالاککرن! 🔔',
        });
        if (showToast) {
          showToast('سەرکەفتن', 'زەنگ و نۆتیفیکەیشنێن ئایفۆنێ هاتنە چالاککرن ✓', 'success');
        }
        setIsVisible(false);
      } else {
        if (showToast) {
          showToast('ئاگاداری', 'تە ڕێدان نەدا، دشێی هەر دەم ژ ڕێکخستنان چالاک بکەی', 'info');
        }
      }
    } catch (e) {
      console.warn('Permission request error:', e);
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('dr_badini_notif_prompt_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-x-3 top-3 z-[9999] max-w-lg mx-auto rounded-[1.6rem] p-4 shadow-2xl border backdrop-blur-2xl transition-all duration-300 animate-fade-in"
      style={{
        background: 'rgba(15, 23, 42, 0.94)',
        borderColor: 'rgba(56, 189, 248, 0.35)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.2)',
        color: '#ffffff',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
            <Bell size={20} className="animate-bounce" />
          </div>
          <div>
            <div className="text-sm font-black flex items-center gap-1.5 text-white">
              <span>چالاککرنا زەنگا دەرمانان</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                iOS Alarm
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
              بۆ هندێ ئایفۆن دەمێ حەبکێ ل دەرڤەی بەرنامەی زەنگێ لێبدەت، ئەڤێ دوگمەیێ دابگرە:
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-end gap-2">
        <button
          onClick={handleClose}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
        >
          پاشتر
        </button>

        <button
          onClick={handleRequest}
          disabled={isActivating}
          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isActivating ? (
            <span>یا دهێتە چالاککرن...</span>
          ) : (
            <>
              <Sparkles size={14} />
              <span>ڕێدان و چالاککرن (Allow) 🔔</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default IOSPermissionPrompt;

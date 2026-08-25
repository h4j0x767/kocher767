import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertCircle, Sparkles, Heart, Zap, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type?: 'success' | 'alert' | 'favorite' | 'ai' | 'info';
}

interface IOSNotificationToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

const IOSNotificationToast: React.FC<IOSNotificationToastProps> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 30, 15]);
      }
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />;
      case 'favorite':
        return <Heart size={20} className="text-rose-400 fill-rose-400 shrink-0" />;
      case 'ai':
        return <Sparkles size={20} className="text-indigo-400 shrink-0" />;
      case 'alert':
        return <AlertCircle size={20} className="text-amber-400 shrink-0" />;
      default:
        return <Bell size={20} className="text-sky-400 shrink-0" />;
    }
  };

  return (
    <div
      onClick={() => {
        setVisible(false);
        setTimeout(onDismiss, 250);
      }}
      className="fixed left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-80px) scale(0.92)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="pointer-events-auto w-full max-w-sm bg-slate-900/90 dark:bg-slate-900/95 text-white backdrop-blur-2xl rounded-[1.75rem] p-3.5 px-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-white/15 flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
        dir="rtl"
      >
        {/* App Icon Pill */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-white/10 shadow-inner shrink-0">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-bold text-white tracking-tight truncate">
              {toast.title}
            </h4>
            <span className="text-[10px] font-medium text-slate-400 shrink-0">ئێستا</span>
          </div>
          <p className="text-[11.5px] font-normal text-slate-300 truncate leading-snug mt-0.5">
            {toast.body}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IOSNotificationToast;

import React, { useState, useEffect, useRef } from 'react';
import { Pill, Check, X, Clock, BellRing } from 'lucide-react';
import { MedicationAlertEventDetail } from '../services/notificationService';

interface IOSNotificationBannerProps {
  onMarkAsTaken?: (medName: string, time: string) => void;
  onOpenMedication?: (medName: string) => void;
}

export const IOSNotificationBanner: React.FC<IOSNotificationBannerProps> = ({
  onMarkAsTaken,
  onOpenMedication,
}) => {
  const [alert, setAlert] = useState<MedicationAlertEventDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleAlert = (e: CustomEvent<MedicationAlertEventDetail>) => {
      setAlert(e.detail);
      setIsVisible(true);
      setDragY(0);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 7000);
    };

    window.addEventListener('dr-smart:medication-alert' as any, handleAlert);
    return () => {
      window.removeEventListener('dr-smart:medication-alert' as any, handleAlert);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    if (diff < 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY < -30) {
      handleDismiss();
    } else {
      setDragY(0);
    }
    dragStartY.current = null;
  };

  if (!alert) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-[999999] pointer-events-none transition-all duration-400 ease-out px-3`}
      style={{
        top: 'max(10px, calc(env(safe-area-inset-top, 0px) + 6px))',
        transform: isVisible
          ? `translateY(${dragY}px)`
          : 'translateY(-140%) scale(0.96)',
        opacity: isVisible ? 1 : 0,
      }}
      dir="rtl"
    >
      <div
        className="pointer-events-auto max-w-sm sm:max-w-md mx-auto rounded-[22px] p-3.5 shadow-2xl transition-transform active:scale-[0.98] select-none"
        style={{
          background: 'rgba(28, 28, 30, 0.88)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25)',
          color: '#ffffff',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (onOpenMedication) onOpenMedication(alert.medName);
        }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-md shrink-0 bg-emerald-900/60 p-0.5">
              <img
                src={alert.icon || '/logo.png'}
                alt="App Icon"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[13px] font-extrabold tracking-tight text-white/95">
                {alert.title || 'نۆژدارێ زیرەک'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <BellRing size={10} className="animate-pulse" />
                <span>زەنگا دەرمانی</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-white/45 tracking-wide">
              نوکە • {alert.time}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/60 transition-colors mr-0.5"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Notification Body Text */}
        <div className="pr-1 text-right">
          <p className="text-[13.5px] font-bold text-white leading-snug tracking-tight">
            {alert.body}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkAsTaken) onMarkAsTaken(alert.medName, alert.time);
              handleDismiss();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
          >
            <Check size={14} strokeWidth={3} />
            <span>خار (وەرگرت)</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/85 text-xs font-bold transition-all"
          >
            پاشبێخە
          </button>
        </div>
      </div>
    </div>
  );
};

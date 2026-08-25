import React from 'react';
import { Zap, Pill, Clock, Heart, Settings } from 'lucide-react';

export type NavTab = 'home' | 'meds' | 'history' | 'favorites' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  historyCount?: number;
  favoritesCount?: number;
  medsCount?: number;
}

const tabs = [
  { id: 'home' as NavTab, icon: Zap, label: 'نوژدار' },
  { id: 'meds' as NavTab, icon: Pill, label: 'دەرمان' },
  { id: 'history' as NavTab, icon: Clock, label: 'مێژوو' },
  { id: 'favorites' as NavTab, icon: Heart, label: 'دلخازی' },
  { id: 'settings' as NavTab, icon: Settings, label: 'رێکخستن' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, historyCount = 0, favoritesCount = 0, medsCount = 0 }) => {
  const badges: Partial<Record<NavTab, number>> = {
    meds: medsCount,
    history: historyCount,
    favorites: favoritesCount,
  };

  return (
    <>
      <style>{`
        @keyframes tab-bounce {
          0%   { transform: translateY(0) scale(1); }
          35%  { transform: translateY(-4px) scale(1.1); }
          65%  { transform: translateY(-1px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes tab-glow-in {
          from { opacity: 0; transform: scaleX(0.4); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        .tab-active-bounce { animation: tab-bounce 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .tab-glow-pill { animation: tab-glow-in 0.25s ease forwards; }
      `}</style>

      {/* Bottom Nav Container */}
      <div
        className="print:hidden ios-bottom-nav"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: 'calc(100% - 28px)',
          maxWidth: '390px',
        }}
      >
        {/* iOS Frosted Floating Dock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: 'var(--surface)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: '999px',
            padding: '6px 8px',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 35px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06)',
            transition: 'background 0.25s ease, border-color 0.25s ease',
          }}
        >
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            const badge = badges[id];
            const showBadge = badge != null && badge > 0;

            return (
              <button
                key={id}
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(8);
                  }
                  onTabChange(id);
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  outline: 'none',
                  transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
                  minWidth: '58px',
                  touchAction: 'manipulation',
                }}
              >
                {/* Active pill background */}
                {isActive && (
                  <span
                    className="tab-glow-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '999px',
                      background: 'var(--bg2)',
                      opacity: 0.9,
                    }}
                  />
                )}

                {/* Icon wrapper */}
                <span
                  className={isActive ? 'tab-active-bounce' : ''}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text3)',
                      transition: 'color 0.2s ease',
                      fill: isActive && id === 'favorites' ? 'var(--accent)' : 'none',
                    }}
                  />

                  {/* Badge count */}
                  {showBadge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '-6px',
                        minWidth: '15px',
                        height: '15px',
                        padding: '0 3.5px',
                        borderRadius: '999px',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 900,
                        lineHeight: '15px',
                        textAlign: 'center',
                        boxShadow: '0 0 5px rgba(239,68,68,0.6)',
                      }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>

                {/* Label */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 900 : 600,
                    color: isActive ? 'var(--text)' : 'var(--text3)',
                    transition: 'color 0.2s ease, font-weight 0.2s ease',
                    zIndex: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNav;

import React, { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
//  Lightweight Stack Navigator — works in any web/capacitor app
//  Mimics React Navigation's stack with slide + fade transitions.
// ─────────────────────────────────────────────────────────────

type ScreenName = string;

interface StackEntry {
  name: ScreenName;
  params?: Record<string, unknown>;
  id: number;           // unique key per push
}

type Direction = 'push' | 'pop' | 'reset';

export interface NavigationProp {
  navigate: (screen: ScreenName, params?: Record<string, unknown>) => void;
  goBack: () => void;
  reset: (screen: ScreenName, params?: Record<string, unknown>) => void;
  currentRoute: ScreenName;
  params: Record<string, unknown>;
  canGoBack: boolean;
}

interface StackNavigatorProps {
  initialRoute: ScreenName;
  screens: Record<ScreenName, React.ComponentType<{ navigation: NavigationProp }>>;
  screenOptions?: {
    animation?: 'slide' | 'fade' | 'slide-up' | 'scale';
    duration?: number;   // ms
  };
}

// Animation keyframes injected once
const ANIMATION_CSS = `
@keyframes sn-slide-in-right  { from { transform:translateX(100%); opacity:0.6; } to { transform:translateX(0);    opacity:1; } }
@keyframes sn-slide-out-left  { from { transform:translateX(0);    opacity:1;   } to { transform:translateX(-30%); opacity:0; } }
@keyframes sn-slide-in-left   { from { transform:translateX(-30%); opacity:0;   } to { transform:translateX(0);    opacity:1; } }
@keyframes sn-slide-out-right { from { transform:translateX(0);    opacity:1;   } to { transform:translateX(100%); opacity:0.6; } }
@keyframes sn-slide-up-in     { from { transform:translateY(100%); opacity:0.8; } to { transform:translateY(0);    opacity:1; } }
@keyframes sn-slide-up-out    { from { transform:translateY(0);    opacity:1;   } to { transform:translateY(-10%); opacity:0; } }
@keyframes sn-fade-in         { from { opacity:0; }                               to { opacity:1; }                            }
@keyframes sn-fade-out        { from { opacity:1; }                               to { opacity:0; }                            }
@keyframes sn-scale-in        { from { transform:scale(0.93); opacity:0; }        to { transform:scale(1);     opacity:1; }    }
@keyframes sn-scale-out       { from { transform:scale(1);    opacity:1; }        to { transform:scale(0.93);  opacity:0; }    }
.sn-screen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  will-change: transform, opacity;
  backface-visibility: hidden;
}
`;

let _styleInjected = false;
const injectStyle = () => {
  if (_styleInjected || typeof document === 'undefined') return;
  _styleInjected = true;
  const el = document.createElement('style');
  el.id = '__stack-navigator-css__';
  el.textContent = ANIMATION_CSS;
  document.head.appendChild(el);
};

let _idCounter = 0;

export const StackNavigator: React.FC<StackNavigatorProps> = ({
  initialRoute,
  screens,
  screenOptions = {},
}) => {
  const { animation = 'slide', duration = 320 } = screenOptions;
  const [stack, setStack] = useState<StackEntry[]>([{ name: initialRoute, id: ++_idCounter }]);
  const [direction, setDirection] = useState<Direction>('reset');
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    injectStyle();
  }, []);

  const startAnimation = (dir: Direction, cb: () => void) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setDirection(dir);
    setIsAnimating(true);
    cb();
    animTimerRef.current = setTimeout(() => setIsAnimating(false), duration);
  };

  const navigate = (screen: ScreenName, params?: Record<string, unknown>) => {
    startAnimation('push', () => {
      setStack(prev => [...prev, { name: screen, params, id: ++_idCounter }]);
    });
  };

  const goBack = () => {
    if (stack.length <= 1) return;
    startAnimation('pop', () => {
      setStack(prev => prev.slice(0, -1));
    });
  };

  const reset = (screen: ScreenName, params?: Record<string, unknown>) => {
    startAnimation('reset', () => {
      setStack([{ name: screen, params, id: ++_idCounter }]);
    });
  };

  // ── Compute per-screen animations ───────────────────────────
  const getAnimation = (index: number, stackLen: number): React.CSSProperties => {
    const isTop = index === stackLen - 1;
    const dStr = `${duration}ms`;
    const ease = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    if (!isAnimating) {
      return { zIndex: index, display: isTop ? 'block' : 'none' };
    }

    const animMap: Record<typeof animation, { inAnim: string; outAnim: string }> = {
      'slide':    { inAnim: `sn-slide-in-right ${dStr} ${ease} both`, outAnim: `sn-slide-out-left ${dStr} ${ease} both` },
      'slide-up': { inAnim: `sn-slide-up-in ${dStr} ${ease} both`,   outAnim: `sn-slide-up-out ${dStr} ${ease} both`   },
      'fade':     { inAnim: `sn-fade-in ${dStr} ease both`,           outAnim: `sn-fade-out ${dStr} ease both`          },
      'scale':    { inAnim: `sn-scale-in ${dStr} ${ease} both`,       outAnim: `sn-scale-out ${dStr} ${ease} both`      },
    };

    const { inAnim, outAnim } = animMap[animation];

    if (direction === 'push') {
      if (isTop) return { zIndex: 10, animation: inAnim };
      if (index === stackLen - 2) return { zIndex: 5, display: 'block', animation: outAnim };
      return { zIndex: index, display: 'none' };
    }
    if (direction === 'pop') {
      // After pop the new top is already set; previous top was removed
      if (isTop) {
        return {
          zIndex: 5,
          display: 'block',
          animation: animation === 'slide'
            ? `sn-slide-in-left ${dStr} ${ease} both`
            : inAnim,
        };
      }
      return { zIndex: index, display: 'none' };
    }
    // reset
    if (isTop) return { zIndex: 10, animation: `sn-fade-in ${dStr} ease both` };
    return { zIndex: index, display: 'none' };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {stack.map((entry, index) => {
        const Screen = screens[entry.name];
        if (!Screen) return null;

        const navProp: NavigationProp = {
          navigate,
          goBack,
          reset,
          currentRoute: entry.name,
          params: entry.params || {},
          canGoBack: stack.length > 1,
        };

        const animStyle = getAnimation(index, stack.length);

        return (
          <div
            key={entry.id}
            className="sn-screen"
            style={animStyle}
          >
            <Screen navigation={navProp} />
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Convenience HOC: wrap existing component to inject navigation
// ─────────────────────────────────────────────────────────────
export const withNavigation = <P extends object>(
  Component: React.ComponentType<P & { navigation: NavigationProp }>
): React.FC<P & { navigation: NavigationProp }> => {
  return (props) => <Component {...props} />;
};

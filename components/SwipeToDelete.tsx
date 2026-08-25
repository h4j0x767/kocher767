/**
 * SwipeToDelete.tsx
 * iOS-style swipe-to-delete component.
 * Swipe RIGHT (→) to reveal the red delete zone on the left.
 * Supports touch (mobile) and mouse (desktop).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  /** Width (px) of the revealed delete zone. Default: 88 */
  deleteZoneWidth?: number;
}

const THRESHOLD = 88;          // px to swipe before delete triggers
const SPRING    = 'cubic-bezier(0.34, 1.56, 0.64, 1)';  // spring back
const EASE_OUT  = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  onDelete,
  children,
  deleteZoneWidth = THRESHOLD,
}) => {
  const [offset,    setOffset]    = useState(0);
  const [isDragging, setDragging] = useState(false);
  const [isLeaving,  setLeaving]  = useState(false);  // exit animation

  const startX   = useRef(0);
  const curX     = useRef(0);
  const dragging = useRef(false);

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const begin = useCallback((x: number) => {
    startX.current = x;
    curX.current   = x;
    dragging.current = true;
    setDragging(true);
  }, []);

  const move = useCallback((x: number) => {
    if (!dragging.current) return;
    curX.current = x;
    const dx = x - startX.current;
    if (dx > 0) {
      // Resistance after threshold so it doesn't fly off screen
      const clamped = dx < deleteZoneWidth
        ? dx
        : deleteZoneWidth + (dx - deleteZoneWidth) * 0.25;
      setOffset(clamped);
    }
  }, [deleteZoneWidth]);

  const end = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setDragging(false);

    if (offset >= deleteZoneWidth) {
      // Confirmed delete: slide fully out to the right, then call onDelete
      setLeaving(true);
      setTimeout(onDelete, 340);
    } else {
      // Spring back to 0
      setOffset(0);
    }
  }, [offset, deleteZoneWidth, onDelete]);

  // ── Touch ─────────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => begin(e.touches[0].clientX);
  const onTouchMove  = (e: React.TouchEvent) => move(e.touches[0].clientX);
  const onTouchEnd   = () => end();

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const onMouseDown  = (e: React.MouseEvent) => begin(e.clientX);
  const onMouseMove  = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    move(e.clientX);
  };
  const onMouseUp    = () => end();
  const onMouseLeave = () => { if (dragging.current) end(); };

  // ── Derived state ─────────────────────────────────────────────────────────
  const progress  = Math.min(offset / deleteZoneWidth, 1);   // 0 → 1
  const isReady   = offset >= deleteZoneWidth;
  const iconScale = 0.6 + progress * 0.4;
  const iconOpacity = Math.max(0, (progress - 0.15) / 0.85);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ borderRadius: '1rem' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Delete zone (revealed from left) ─────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: `${offset}px`,
          minWidth: 0,
          maxWidth: '100%',
          background: isReady
            ? 'linear-gradient(135deg, #dc2626, #ef4444)'
            : `linear-gradient(135deg, rgba(220,38,38,${0.15 + progress * 0.85}), rgba(239,68,68,${0.1 + progress * 0.9}))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: isDragging ? 'none' : `width 0.32s ${SPRING}, background 0.2s ease`,
          borderRadius: '1rem 0 0 1rem',
          zIndex: 0,
        }}
      >
        {/* Trash icon */}
        <div
          style={{
            opacity: iconOpacity,
            transform: `scale(${iconScale}) ${isReady ? 'translateY(-2px)' : ''}`,
            transition: isDragging ? 'none' : 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Trash2
            size={isReady ? 26 : 22}
            color="white"
            strokeWidth={isReady ? 2.5 : 2}
            style={{ transition: isDragging ? 'none' : 'all 0.18s ease' }}
          />
          {isReady && (
            <span
              style={{
                color: 'white',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              بسڕە
            </span>
          )}
        </div>
      </div>

      {/* ── Content card ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          transform: isLeaving
            ? 'translateX(110%)'
            : `translateX(${offset}px)`,
          opacity: isLeaving ? 0 : 1,
          transition: isDragging
            ? 'none'
            : isLeaving
              ? `all 0.34s ${EASE_OUT}`
              : `transform 0.38s ${SPRING}, opacity 0.2s ease`,
          cursor: isDragging ? 'grabbing' : 'grab',
          // Subtle red border glow when swiping
          boxShadow: progress > 0.1
            ? `0 0 0 ${Math.round(progress * 2)}px rgba(239,68,68,${progress * 0.5}), 0 4px 20px rgba(0,0,0,0.08)`
            : undefined,
          borderRadius: '1rem',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeToDelete;

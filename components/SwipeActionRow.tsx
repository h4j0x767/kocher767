import React, { useState, useRef, useCallback } from 'react';
import { Trash2, FileEdit } from 'lucide-react';

interface SwipeActionRowProps {
  onDelete: () => void;
  onNote?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
}

const ACTION_WIDTH = 140; // Total width for Note + Delete (70px each)
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export const SwipeActionRow: React.FC<SwipeActionRowProps> = ({
  onDelete,
  onNote,
  onClick,
  children,
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const startX = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const dragDistance = useRef(0);

  const handleStart = useCallback((x: number) => {
    startX.current = x;
    startOffset.current = offset;
    dragging.current = true;
    hasMoved.current = false;
    dragDistance.current = 0;
    setIsDragging(true);
  }, [offset]);

  const handleMove = useCallback((x: number) => {
    if (!dragging.current) return;
    const dx = x - startX.current;
    dragDistance.current = Math.abs(dx);

    if (dragDistance.current > 8) {
      hasMoved.current = true;
    }

    const newOffset = startOffset.current + dx;

    if (newOffset > 0) {
      // Swiping right: resistance past full action width
      const clamped = newOffset <= ACTION_WIDTH
        ? newOffset
        : ACTION_WIDTH + (newOffset - ACTION_WIDTH) * 0.25;
      setOffset(clamped);
    } else {
      setOffset(0);
    }
  }, []);

  const handleEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);

    if (offset > 220) {
      // Full swipe right -> quick delete
      setIsLeaving(true);
      setTimeout(onDelete, 280);
    } else if (offset > 50) {
      // Snap open actions
      setOffset(ACTION_WIDTH);
    } else {
      // Snap closed
      setOffset(0);
    }
  }, [offset, onDelete]);

  const closeActions = () => {
    setOffset(0);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLeaving(true);
    setTimeout(onDelete, 280);
  };

  const handleNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeActions();
    if (onNote) onNote();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If it was a swipe drag, prevent opening the detail page
    if (hasMoved.current || dragDistance.current > 8) {
      e.stopPropagation();
      e.preventDefault();
      hasMoved.current = false;
      return;
    }

    // If actions are already revealed, close them instead of opening
    if (offset > 10) {
      e.stopPropagation();
      closeActions();
      return;
    }

    // Pure tap -> open detail page
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className="relative overflow-hidden select-none rounded-2xl"
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => { if (dragging.current) handleMove(e.clientX); }}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (dragging.current) handleEnd(); }}
      onClickCapture={(e) => {
        if (hasMoved.current || dragDistance.current > 8) {
          e.stopPropagation();
        }
      }}
    >
      {/* ── Actions Container (Revealed from Left behind the card) ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${Math.max(offset, ACTION_WIDTH)}px`,
          display: 'flex',
          zIndex: 0,
          overflow: 'hidden',
          borderRadius: '1rem',
          opacity: offset > 0 ? 1 : 0,
          visibility: offset > 0 ? 'visible' : 'hidden',
          transition: isDragging ? 'none' : 'opacity 0.15s ease, visibility 0.15s ease',
          pointerEvents: offset > 0 ? 'auto' : 'none',
        }}
      >
        {/* Note Action Button (Blue) */}
        {onNote && (
          <button
            onClick={handleNoteClick}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border-none"
            style={{
              background: '#3b82f6',
              color: '#ffffff',
              padding: '0 8px',
            }}
          >
            <FileEdit size={20} strokeWidth={2.5} />
            <span style={{ fontSize: 11, fontWeight: 900 }}>تێبینی</span>
          </button>
        )}

        {/* Delete Action Button (Red) */}
        <button
          onClick={handleDeleteClick}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border-none"
          style={{
            background: '#ef4444',
            color: '#ffffff',
            padding: '0 8px',
          }}
        >
          <Trash2 size={20} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 900 }}>ژێبرن</span>
        </button>
      </div>

      {/* ── Foreground Item Card ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          transform: isLeaving ? 'translateX(120%)' : `translateX(${offset}px)`,
          opacity: isLeaving ? 0 : 1,
          transition: isDragging
            ? 'none'
            : isLeaving
            ? 'all 0.28s ease-out'
            : `transform 0.35s ${SPRING}, opacity 0.2s ease`,
          cursor: isDragging ? 'grabbing' : 'pointer',
          willChange: 'transform',
        }}
        onClick={handleCardClick}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeActionRow;

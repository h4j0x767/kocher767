import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StickyNote, X, Check, Trash2 } from 'lucide-react';

interface NoteModalProps {
  title: string;
  initialNote?: string;
  onSave: (note: string) => void;
  onClose: () => void;
  onDeleteNote?: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  title,
  initialNote = '',
  onSave,
  onClose,
  onDeleteNote,
}) => {
  const [note, setNote] = useState(initialNote);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNote(initialNote);
  }, [initialNote]);

  const handleSave = () => {
    onSave(note.trim());
  };

  const handleDelete = () => {
    if (onDeleteNote) {
      onDeleteNote();
    } else {
      onSave('');
    }
  };

  if (!mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] transition-all duration-200"
      style={{
        zIndex: 999999,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
      }}
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] border shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200 relative"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── iOS Drag Handle Pill ── */}
        <div className="flex justify-center -mt-1 mb-1">
          <div
            className="w-10 h-1 rounded-full opacity-50"
            style={{ background: 'var(--border)' }}
          />
        </div>

        {/* ── Sheet Header ── */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
            >
              <StickyNote size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
                تێبینیا پزیشکی
              </h3>
              <p className="text-[11px] font-bold truncate max-w-[200px] sm:max-w-[260px] mt-0.5" style={{ color: 'var(--text3)' }}>
                {title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center border transition-transform active:scale-90 cursor-pointer"
            style={{
              background: 'var(--bg2)',
              borderColor: 'var(--border)',
              color: 'var(--text2)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Note Textarea Box (Apple Notes Clean Box) ── */}
        <div className="space-y-1.5">
          <div
            className="rounded-2xl border p-3 transition-all"
            style={{
              background: 'var(--bg2)',
              borderColor: 'var(--border)',
            }}
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="تێبینیا خۆ ل سەر ڤی بابەتی بنڤیسە... (بۆ نموونە: دەمێ وەرگرتنا حەبان، ڕێنمایێن نۆژداری، یاداشتێن تایبەت)"
              rows={4}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm font-semibold leading-relaxed resize-none"
              style={{ color: 'var(--text)', outline: 'none' }}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between px-1 text-[10px] sm:text-[11px] font-bold" style={{ color: 'var(--text3)' }}>
            <span>تێبینی ب ئۆتۆماتیکی دهێتە پاراستن</span>
            <span>{note.length} پیت</span>
          </div>
        </div>

        {/* ── Action Buttons Row ── */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 border shadow-sm cursor-pointer"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-t)',
              borderColor: 'var(--accent)',
            }}
          >
            <Check size={16} strokeWidth={3} />
            <span>پاشەکەفتکرنا تێبینیێ</span>
          </button>

          {initialNote && (
            <button
              onClick={handleDelete}
              className="py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition-transform active:scale-95 border cursor-pointer"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
              }}
              title="ژێبرنا تێبینیێ"
            >
              <Trash2 size={15} />
              <span>ژێبرن</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-3.5 rounded-2xl font-bold text-xs flex items-center justify-center transition-transform active:scale-95 border cursor-pointer"
            style={{
              background: 'var(--bg2)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default NoteModal;

import React, { useState } from 'react';
import { Heart, Trash2, ChevronLeft, ChevronRight, Calendar, Printer, Check, Star, Share2, FileEdit, X, StickyNote } from 'lucide-react';
import { DynamicIcon } from './Icons';
import SwipeActionRow from './SwipeActionRow';
import NoteModal from './NoteModal';

export interface FavoriteItem {
  name: string;
  englishSubtitle: string;
  description: string;
  savedAt: number;
  rating?: number;
  note?: string;
  stats?: Array<{ label: string; value: string; icon: string; color?: string }>;
  sections?: Array<{ title: string; content: string; icon: string }>;
  references?: Array<{ name: string; url: string }>;
}

interface FavoritesPanelProps {
  darkMode: boolean;
  onSelectFavorite: (item: FavoriteItem) => void;
}

const cleanText = (text: string) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/#/g, '');
};

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} ڕۆژ پێش`;
  if (h > 0) return `${h} کاتژمێر پێش`;
  if (m > 0) return `${m} خولەک پێش`;
  return 'نوکە';
};

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleDateString('ku', { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ─── Detail View ─────────────────────────────────── */
const FavoriteDetailView: React.FC<{
  item: FavoriteItem;
  onBack: () => void;
}> = ({ item, onBack }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${item.name}\n${item.englishSubtitle}\n\n${cleanText(item.description)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="min-h-screen pb-20 font-sans transition-colors duration-200"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      dir="rtl"
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-30 print:hidden transition-colors"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        }}
      >
        <div className="relative px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border"
            style={{
              background: 'var(--bg2)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <ChevronRight size={16} />
            <span>زڤڕین</span>
          </button>

          {/* Absolute Dead-Center Title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-24">
            <span className="text-xs sm:text-sm font-black flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              <Heart size={12} fill="currentColor" />
              دلخازییا پاراستی
            </span>
            <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>{timeAgo(item.savedAt)}</span>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <DynamicIcon name="copy" size={15} />}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-t)',
              }}
            >
              <Printer size={13} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Main title card */}
        <div
          className="relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--accent)' }}>
              <Heart size={12} fill="currentColor" />
              د کەتەلۆگا دلخازیان دا
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
              {item.name}
            </h2>
            {item.englishSubtitle && (
              <p className="font-bold text-xs mt-1" style={{ color: 'var(--text2)' }}>
                {item.englishSubtitle}
              </p>
            )}
          </div>

          {/* User Custom Note if available */}
          {item.note && (
            <div
              className="mt-3 p-3 rounded-xl border flex items-start gap-2.5"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
              }}
            >
              <StickyNote size={15} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <span className="text-[10px] font-black block" style={{ color: 'var(--accent)' }}>تێبینیا تە:</span>
                <p className="text-xs font-bold leading-relaxed mt-0.5" style={{ color: 'var(--text)' }}>
                  {item.note}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--text3)' }}>
              <Calendar size={11} />
              پاشەکەفتکرن: {formatDate(item.savedAt)}
            </span>
            {item.rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={13}
                    fill={s <= (item.rating || 0) ? '#f59e0b' : 'transparent'}
                    color={s <= (item.rating || 0) ? '#f59e0b' : 'var(--border)'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        {item.stats && item.stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {item.stats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl p-3.5 flex flex-col items-center text-center border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>
                  {stat.label}
                </p>
                <p className="text-sm font-extrabold leading-snug" style={{ color: 'var(--text)' }} dir="auto">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <h3 className="font-extrabold text-sm" style={{ color: 'var(--text)' }}>
              پوختەیا تەندروستی
            </h3>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-line text-justify font-semibold" style={{ color: 'var(--text2)' }}>
            {cleanText(item.description)}
          </p>
        </div>

        {/* Sections */}
        {item.sections && item.sections.length > 0 && (
          <div className="space-y-3">
            {item.sections.map((section, idx) => (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="p-3.5 border-b flex items-center gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                    style={{ background: 'var(--accent)', color: 'var(--accent-t)' }}
                  >
                    <DynamicIcon name={section.icon || 'activity'} size={13} />
                  </div>
                  <h4 className="font-extrabold text-xs" style={{ color: 'var(--text)' }}>
                    {section.title}
                  </h4>
                </div>
                <div className="p-3.5">
                  <p className="text-xs leading-relaxed whitespace-pre-line text-justify font-semibold" style={{ color: 'var(--text2)' }}>
                    {cleanText(section.content)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Favorites List View ─────────────────────── */
const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ darkMode, onSelectFavorite }) => {
  const [items, setItems] = React.useState<FavoriteItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  });
  const [selectedItem, setSelectedItem] = useState<FavoriteItem | null>(null);
  const [editingNoteItem, setEditingNoteItem] = useState<FavoriteItem | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const removeOne = (savedAt: number) => {
    const updated = items.filter(i => i.savedAt !== savedAt);
    setItems(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const handleOpenNote = (item: FavoriteItem) => {
    setEditingNoteItem(item);
    setNoteInput(item.note || '');
  };

  const handleSaveNote = () => {
    if (!editingNoteItem) return;
    const updated = items.map(i => i.savedAt === editingNoteItem.savedAt ? { ...i, note: noteInput.trim() } : i);
    setItems(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    setEditingNoteItem(null);
  };

  if (selectedItem) {
    return <FavoriteDetailView item={selectedItem} onBack={() => setSelectedItem(null)} />;
  }

  const reversedItems = items.slice().reverse();

  return (
    <div
      dir="rtl"
      className="min-h-screen pb-20 font-sans transition-colors duration-200"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* ── Large-title header (iOS style, No Delete All button) ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        }}
      >
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', maxWidth: 480, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: 0, lineHeight: 1.1 }}>
              دلخازیێن من
            </h1>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', margin: '4px 0 0' }}>
              {items.length} بابەتێن پاشەکەفتکری
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 22,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <Heart size={30} color="var(--accent)" fill="var(--accent)" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              چ دلخازی نینە
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', marginTop: 6, maxWidth: 240, lineHeight: 1.6 }}>
              بابەتێن گرنگ ل ڤێرێ بپارێزە ب کلیککرنا ل سەر ئایکۆنا دلی
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reversedItems.map((item) => (
              <SwipeActionRow
                key={item.savedAt}
                onDelete={() => removeOne(item.savedAt)}
                onNote={() => handleOpenNote(item)}
                onClick={() => setSelectedItem(item)}
              >
                <div
                  className="s-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg2)',
                        color: 'var(--accent)',
                      }}
                    >
                      <Heart size={18} fill="currentColor" />
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
                          {timeAgo(item.savedAt)}
                        </span>
                        {item.note && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <StickyNote size={10} />
                            <span>تێبینی</span>
                          </span>
                        )}
                        {item.englishSubtitle && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            • {item.englishSubtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronLeft size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                </div>
              </SwipeActionRow>
            ))}
          </div>
        )}
      </div>

      {/* ── Note Modal (iOS Bottom Sheet) ── */}
      {editingNoteItem && (
        <NoteModal
          title={editingNoteItem.name}
          initialNote={editingNoteItem.note || ''}
          onSave={(newNote) => {
            const updated = items.map((i) =>
              i.savedAt === editingNoteItem.savedAt ? { ...i, note: newNote } : i
            );
            setItems(updated);
            localStorage.setItem('favorites', JSON.stringify(updated));
            setEditingNoteItem(null);
          }}
          onDeleteNote={() => {
            const updated = items.map((i) =>
              i.savedAt === editingNoteItem.savedAt ? { ...i, note: undefined } : i
            );
            setItems(updated);
            localStorage.setItem('favorites', JSON.stringify(updated));
            setEditingNoteItem(null);
          }}
          onClose={() => setEditingNoteItem(null)}
        />
      )}
    </div>
  );
};

export default FavoritesPanel;

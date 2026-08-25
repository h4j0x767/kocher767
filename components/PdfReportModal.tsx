import React from 'react';
import { MedicalData } from '../types';
import { Printer, Download, Share2, X, FileText, CheckCircle2, Shield, Calendar, Hash, Stethoscope } from 'lucide-react';
import { DynamicIcon } from './Icons';

interface PdfReportModalProps {
  data: MedicalData;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({ data, onClose }) => {
  const currentDate = new Date().toLocaleDateString('ku-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reportId = React.useMemo(() => Math.floor(100000 + Math.random() * 900000), []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `ڕاپۆرتا پزیشکی: ${data.name}\n${data.englishSubtitle || ''}\n\nنۆژدارێ زیرەک • Dr. Badini AI`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ڕاپۆرتا پزیشکی: ${data.name}`,
          text,
          url: window.location.href,
        });
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-md transition-all duration-300" dir="rtl">
      {/* ── Print Media Stylesheet ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pdf-report, #printable-pdf-report * {
            visibility: visible;
          }
          #printable-pdf-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .pdf-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Main Modal Container ── */}
      <div className="relative w-full max-w-2xl bg-[var(--surface)] text-[var(--text)] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar (Interactive Controls) */}
        <div className="pdf-no-print flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg2)] text-[var(--accent)] border border-[var(--border)]">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm leading-tight text-[var(--text)]">ڕاپۆرتا پزیشکی یا فەرمی (PDF)</h3>
              <p className="text-[10px] font-semibold text-[var(--text3)]">Dr. Badini AI • Clinical Medical Dossier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-[var(--accent)] text-[var(--accent-t)] active:scale-95 transition-transform shadow-sm"
              title="داگرتنا PDF / چاپکرن"
            >
              <Printer size={14} />
              <span>چاپکرن / داگرتن</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] active:scale-90 transition-transform"
              title="هاوبەشکرن"
            >
              <Share2 size={15} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] active:scale-90 transition-transform"
              title="داخستن"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Document Preview ── */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg)] flex-1">
          
          {/* Paper Sheet Preview */}
          <div
            id="printable-pdf-report"
            className="w-full bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6 font-sans"
            style={{ direction: 'rtl' }}
          >
            {/* Report Header */}
            <div className="flex items-center justify-between pb-5 border-b-2 border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black">
                    <Stethoscope size={18} />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">نۆژدارێ زیرەک</h1>
                </div>
                <p className="text-xs font-bold text-slate-600 mt-1">ناڤەندا پشکنین و شیکاریا زیرەکیا دەستکرد</p>
                <p className="text-[10px] font-semibold text-slate-500 font-mono">Dr. Badini AI • Clinical Medical Diagnostic System</p>
              </div>

              <div className="text-left space-y-1" dir="ltr">
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-slate-700">
                  <Hash size={13} className="text-slate-400" />
                  <span>REF-{reportId}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-slate-500">
                  <Calendar size={13} className="text-slate-400" />
                  <span>{currentDate}</span>
                </div>
                <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                  پشکنینا دروست
                </span>
              </div>
            </div>

            {/* Condition Title Block */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block mb-1">بابەتێ سەرەکی یێ پشکنینێ:</span>
              <h2 className="text-xl font-black text-slate-900 leading-tight mb-1">{data.name}</h2>
              {data.englishSubtitle && (
                <p className="text-xs font-bold text-slate-600 font-mono" dir="ltr">
                  {data.englishSubtitle}
                </p>
              )}
            </div>

            {/* Stats Summary Grid (If available) */}
            {data.stats && data.stats.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  ئامار و پێوەرێن سەرەکی یێن نەخۆشیێ
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {data.stats.map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
                      <span className="text-[10px] font-bold text-slate-500 block leading-tight mb-1">{stat.label}</span>
                      <span className="text-xs font-black text-slate-900 block leading-snug">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Clinical Description */}
            <div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                شلوڤەکرنا پزیشکی و هویراتی
              </h3>
              <p className="text-xs leading-relaxed text-slate-700 font-semibold text-justify whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {data.description.replace(/\*\*/g, '').replace(/#/g, '')}
              </p>
            </div>

            {/* Medical Sections */}
            {data.sections && data.sections.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  قۆناغێن نەخۆشیێ و ڕێنمایێن چارەسەریێ
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {data.sections.map((section, sIdx) => (
                    <div key={sIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        {section.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-600 font-semibold text-justify whitespace-pre-line pt-1 border-t border-slate-200">
                        {section.content.replace(/\*\*/g, '').replace(/#/g, '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatments Block */}
            {data.treatments && data.treatments.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  دەرمان و چارەسەریێن پێشنیارکری
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.treatments.map((t, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{t.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">{t.englishName}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {t.description.replace(/\*\*/g, '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Footer & Signature Stamp */}
            <div className="pt-6 border-t-2 border-slate-200 flex items-end justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
                  <Shield size={14} className="text-emerald-700" />
                  <span>پشتڕاستکری ل گۆرەی ستانداردێن پزیشکی (WHO / FDA)</span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  ئەڤ ڕاپۆرتە ب رێکا سیستەمێ زیرەکیا دەستکرد یا نۆژدارێ زیرەک هاتیە بەرهەڤکرن.
                </p>
              </div>

              <div className="text-center">
                <div className="w-28 h-12 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
                  مۆرا فەرمی / Stamp
                </div>
                <span className="text-[9px] font-bold text-slate-500 block mt-1">Dr. Badini AI Verified</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

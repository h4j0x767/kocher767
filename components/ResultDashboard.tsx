import React, { useState, useRef } from 'react';
import { MedicalData } from '../types';
import { DynamicIcon } from './Icons';
import { Star, ArrowRight, Check, RefreshCw, X, Sparkles, ShieldCheck, Activity, Info } from 'lucide-react';
import { GpsNearby } from './GpsNearby';
import { PdfReportModal } from './PdfReportModal';

interface ResultDashboardProps {
  data: MedicalData;
  onBack: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

// Helper to remove markdown symbols if the AI slips up
const cleanText = (text: string) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/#/g, '');
};

const getStatDetails = (stat: { label: string; value: string }, conditionName: string) => {
  const lbl = (stat.label + ' ' + stat.value).toLowerCase();

  if (lbl.includes('ڕێژە') || lbl.includes('٪') || lbl.includes('جێندەر') || lbl.includes('مێ') || lbl.includes('بەربڵاڤ')) {
    return {
      title: stat.label,
      value: stat.value,
      tag: 'ئامارا گشتی یا پزیشکی',
      desc: `ئەڤ ئامارە نیشان ددەت کا چەند کەس د جڤاکێ مە و جیهانێ دا تووشی ڤێ نەخۆشیێ یان ڤان نیشانان دبن. ل گۆرەی ڤەکۆلینێن فەرمی یێن پزیشکی، دیارکرنا بەربڵاڤبوونێ هاریکاریا نۆژداران دکەت بۆ دەستنیشانکرنا زوو و چارەسەریا گونجای.`,
      adviceTitle: 'ڕێنمایێن پێدڤی:',
      advices: [
        'پشتگوێ نەخستنا نیشانێن دەستپێکی یێن نەخۆشیێ.',
        'ئەگەر نیشانێن تە بەردەوام بوون، سەرەدانا نۆژدارێ تایبەتمەند بکە.',
        'ئاگاداربوون ژ مێژوویا خێزانی یا نەخۆشیێ و خۆپاراستن.'
      ],
      source: 'World Health Organization (WHO) & Clinical Guidelines'
    };
  }

  if (lbl.includes('خەو') || lbl.includes('دەمژمێر')) {
    return {
      title: stat.label,
      value: stat.value,
      tag: 'تەندروستیا خەوێ و بەدەنی',
      desc: `خەوا پێدڤی (٧ بۆ ٨ دەمژمێر) ئێک ژ گرنگترین پایەیێن چارەسەری و پاراستنا لەشی یە ژ ئاریشەیێن دەمار و لەشی. کێمیا خەوێ ڕاستەوخۆ دەماران وەستیایی دکەت و دبیتە سەدەمێ سەرئێشانێ و لاوازبوونا بەرگریێ.`,
      adviceTitle: 'ڕێنمایێن ڕێکخستنا خەوێ:',
      advices: [
        'خۆ دووربێخە ژ شاشەیێن مۆبایلێ بەری نڤستنێ ب ٣٠ خولەکان.',
        'ژوورا خەوێ تاریک و فێنک بهێلە.',
        'ڕۆژانە ل دەمەکێ دیارکری بنڤە و ڕابە دا کو کاتژمێرا بایۆلۆجی یا لەشی ڕێکبکەڤیت.'
      ],
      source: 'American Academy of Sleep Medicine (AASM)'
    };
  }

  if (lbl.includes('ئاڤ') || lbl.includes('کارتێکرن') || lbl.includes('خولەک')) {
    return {
      title: stat.label,
      value: stat.value,
      tag: 'کارتێکرنا لەزگین و هایدرەیشن',
      desc: `ڤەخوارنا ئاڤێ ب شێوەیەکێ باش لەشی ژ وشکبوونێ (Dehydration) دپارێزیت، کو ئەڤە ب خۆ ئێک ژ سەدەمێن سەرەکی یێن سەرئێشانا گرژیێ و وەستیانێ یە. کارتێکرنا ئاڤێ د ناڤبەرا ٢٠ بۆ ٣٠ خولەکان دا دەستپێدکەت.`,
      adviceTitle: 'ڕێنمایێن ڤەخوارنا شلەمەنیان:',
      advices: [
        'ڕۆژانە کێمتر ژ ٢ بۆ ٢.٥ لیترێن ئاڤێ نەخۆ.',
        'دەمێ هەست ب سەرئێشانێ دکەی، پەرداخەکا ئاڤا شلەتێن ڤەخۆ.',
        'خۆ ژ ڤەخوارنێن ب شەکرا زۆر دووربێخە.'
      ],
      source: 'Mayo Clinic - Hydration & Brain Function'
    };
  }

  if (lbl.includes('کافاین') || lbl.includes('ملگم') || lbl.includes('قاوە') || lbl.includes('چای')) {
    return {
      title: stat.label,
      value: stat.value,
      tag: 'سندوورا ڕێپێدای یا کافاینی',
      desc: `کافاین ب بڕێن کێم (ژێر ٢٠٠ ملگم) دبیت هاریکار بیت بۆ نەهێشتنا سەرئێشانێ، لێ زێدەگاڤیکرن د کافاینی دا دبیتە سەدەمێ گرژبوونا دەماران و سەرئێشانا ڤەگەڕیایی (Rebound Headache).`,
      adviceTitle: 'ڕێنمایێن کافاینی:',
      advices: [
        'ڕۆژانە ژ ١ بۆ ٢ فنجانێن قاوەیێ زێدەتر نەخۆ.',
        'پشتی دەمژمێر ٥ی ئێڤاری خۆ ژ ڤەخوارنێن کافایندار بپارێزە.',
        'چا و قاوەیێ جهگرێ ئاڤێ نەکە.'
      ],
      source: 'American Migraine Foundation Guidelines'
    };
  }

  if (lbl.includes('دەرمان') || lbl.includes('ڕۆژ')) {
    return {
      title: stat.label,
      value: stat.value,
      tag: 'بکارهێنانا دروست یا دەرمانان',
      desc: `بکارهێنانا بەردەوام و بێ کۆنترۆڵ یا ئازارشکێنان (وەکی پاراسیتۆڵ یان پرۆفین) بۆ زێدەتر ژ ١٥ ڕۆژان د هەیڤێ دا، ب خۆ دبیتە سەدەمێ سەرئێشانەکا نوو کو دبێژنێ (Medication Overuse Headache).`,
      adviceTitle: 'ڕێنمایێن دەرمانان:',
      advices: [
        'دەرمانان بتنێ دەمێ پێدڤی بکاربینە نەک ڕۆژانە.',
        'ژ دوو هەفتیان زێدەتر بەردەوام نەبە ل سەر ئازارشکێنان بێی ڕاوێژا پزیشکی.',
        'ڕێنمایێن نۆژدار و دەرمانسازی ب هووری جێبەجێ بکە.'
      ],
      source: 'International Headache Society (IHS)'
    };
  }

  if (lbl.includes('پزیشک') || lbl.includes('سەردان') || lbl.includes('نەخۆشخانە')) {
    return {
      title: stat.label,
      value: stat.value,
      tag: 'پێدڤیبوونا ڕاوێژا پزیشکی',
      desc: `ئەگەر نیشانێن تە د حەفتیەکێ دا ٣ جاران یان زێدەتر دووبارە بوون، یان ب شێوەیەکێ ناڤبڕ و ب توندی ل تە هاتن، پێدڤیە ب لەز سەرەدانا نۆژدارێ بسپۆر بکەی بۆ پشکنینا هوور.`,
      adviceTitle: 'نیشانێن مەترسیدار کو پێدڤی ب نۆژداری نە:',
      advices: [
        'سەرئێشانا زۆر توند یا ژنشکەکێ ڤە (Thunderclap).',
        'تێکچوونا دیتنێ، گێژبوون یان لاوازبوونا ئێک لایێ لەشی.',
        'سەرئێشان دگەل تا و ڕەقبوونا مل و ستۆی.'
      ],
      source: 'Emergency Medical Protocols & Clinical Neurology'
    };
  }

  return {
    title: stat.label,
    value: stat.value,
    tag: 'زانیاریێن پزیشکی یێن پشتڕاستکری',
    desc: `ئەڤ ئامارە بەشەکە ژ پێوەرێن ستاندارد یێن شیکاریا حالەتێ «${conditionName}». پێگیری ب ڤان پێوەران دێ لەزاتیێ دەتە چاکبوونێ و کێمکرنا نیشانێن نەخۆش.`,
    adviceTitle: 'ڕێنمایێن گشتی:',
    advices: [
      'دوورکەفتن ژ دڵەڕاوکێ و فشاری.',
      'خۆراکا ساخلەم و ڕێکخستنا خەوێ.',
      'پەیوەندی دگەل نۆژداری دەمێ پێدڤی.'
    ],
    source: 'Medical Standards & Evidence-Based Guidelines'
  };
};

const ResultDashboard: React.FC<ResultDashboardProps> = ({ data, onBack, darkMode, setDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSeed] = useState(() => Math.floor(Math.random() * 1000));
  const [selectedStat, setSelectedStat] = useState<any | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // iOS Touch Gesture Drag-to-Dismiss State
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      setSheetTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetTranslateY > 120) {
      setSelectedStat(null);
    }
    setSheetTranslateY(0);
  };

  const rawName = data.englishSubtitle || data.name || 'Medical Condition';
  const cleanEnglishName = rawName.replace(/[^\w\s\u0600-\u06FF]/g, '').trim();

  const fallbackImages = [
    "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1080&q=80"
  ];

  let searchTerm = data.englishSubtitle || data.name || "";
  searchTerm = searchTerm.split(' - ')[0].split(':')[0].split('(')[0].trim();

  const imageQuery = `closeup medical clinical photo illustration of ${searchTerm}, human anatomy, clean studio lighting, high resolution, 8k`;
  const primaryImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageQuery)}?width=800&height=500&seed=${imageSeed}&nologo=true`;
  const displayImageUrl = imageError ? fallbackImages[imageSeed % fallbackImages.length] : primaryImageUrl;

  const handleCopy = async () => {
    const text = `${data.name}\n${data.englishSubtitle}\n\n${cleanText(data.description)}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (e) {}
      document.body.removeChild(textarea);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `نۆژدارێ زیرەک: ${data.name}`,
      text: `${data.name}\n${data.englishSubtitle}\n\nشیکاری ب رێکا زیرەکیا دەستکرد\n\n`,
      url: window.location.href
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        throw new Error('Native share not supported');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (copyErr) {}
    }
  };

  const handlePdf = () => {
    setShowPdfModal(true);
  };

  const isReport = data.name.includes('شیکاریێ نوژداری') || (data.sections.length >= 10);

    if (isReport) {
    return (
      <div
        className="min-h-full pb-8 font-sans dir-rtl text-right transition-colors duration-200"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
        dir="rtl"
      >
        {/* Modern Medical Header */}
        <div
          className="sticky top-0 z-30 px-4 py-3 border-b transition-colors print:hidden"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          }}
        >
          <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between relative">
            <div className="flex items-center z-10">
              <button
                onClick={onBack}
                className="p-2 rounded-full transition-transform active:scale-90 flex items-center justify-center border"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                title="زڤڕین"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h1 className="font-black text-sm md:text-base tracking-tight" style={{ color: 'var(--text)' }}>
                ئەنجامێ شیکاریێ
              </h1>
            </div>

            <div className="flex items-center gap-1.5 z-10">
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                title="کۆپیکرن"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <DynamicIcon name="copy" size={16} />}
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                title="شیرکرن"
              >
                {shared ? <Check size={16} className="text-blue-500" /> : <DynamicIcon name="share" size={16} />}
              </button>
              <button
                onClick={handlePdf}
                className="p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                title="ڕاپۆرتا PDF"
              >
                <DynamicIcon name="pdf" size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-md md:max-w-2xl mx-auto px-4 py-5 space-y-4">
          {/* Detailed Sections */}
          <div className="space-y-3.5">
            {(data.sections || []).map((section, idx) => (
              <div
                key={idx}
                className="border rounded-2xl p-4.5 shadow-xs transition-all"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className="p-2 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'var(--bg2)',
                      color: 'var(--accent)',
                    }}
                  >
                    <DynamicIcon name="info" size={18} />
                  </div>
                  <h3 className="text-base md:text-lg font-black" style={{ color: 'var(--text)' }}>
                    {section.title}
                  </h3>
                </div>
                <div
                  className="text-sm md:text-base leading-relaxed font-semibold text-justify whitespace-pre-line dir-rtl"
                  style={{ color: 'var(--text2)', direction: 'rtl' }}
                >
                  {cleanText(section.content)}
                </div>
              </div>
            ))}
          </div>

          {/* Treatments Section */}
          {data.treatments && data.treatments.length > 0 && (
            <div className="pt-3 pb-2">
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
                  style={{ background: 'var(--accent)', color: 'var(--accent-t)' }}
                >
                  <DynamicIcon name="pill" size={15} />
                </div>
                <div>
                  <h3 className="font-black text-sm leading-tight" style={{ color: 'var(--text)' }}>
                    دەرمان و چارەسەریێن پێشنیارکری
                  </h3>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>
                    Recommended Treatments
                  </p>
                </div>
              </div>

              <div
                style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                className="hide-scrollbar"
              >
                {data.treatments.map((treatment, tIdx) => {
                  const imgPrompt = treatment.imagePrompt
                    ? treatment.imagePrompt
                    : `${treatment.englishName} medicine box packaging pharmaceutical product, clean white background, professional studio photo, sharp`;
                  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=400&height=320&nologo=true&model=flux&seed=${tIdx * 17 + 33}`;

                  return (
                    <div
                      key={tIdx}
                      style={{ minWidth: '220px', maxWidth: '220px', scrollSnapAlign: 'start', flexShrink: 0 }}
                    >
                      <div
                        className="rounded-2xl overflow-hidden border flex flex-col"
                        style={{
                          background: 'var(--surface)',
                          borderColor: 'var(--border)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div className="relative" style={{ height: '140px', background: 'var(--bg2)', overflow: 'hidden' }}>
                          <img
                            src={imgUrl}
                            alt={treatment.englishName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
                            <p className="text-white font-black text-xs leading-tight text-right">{treatment.name}</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', fontWeight: 700, textAlign: 'right' }}>{treatment.englishName}</p>
                          </div>
                        </div>

                        <div className="p-3 flex flex-col gap-2 flex-1">
                          <p
                            className="text-[11px] leading-relaxed text-right"
                            style={{ color: 'var(--text2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                          >
                            {cleanText(treatment.description)}
                          </p>

                          {treatment.kurdishMarketAlternative && (
                            <div
                              className="p-2 rounded-xl border space-y-1 text-right"
                              style={{
                                background: 'var(--bg2)',
                                borderColor: 'var(--border)',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                                  <RefreshCw size={9} className="animate-spin" />
                                  هاوتایێ خۆمانە (کوردستان)
                                </span>
                                {typeof treatment.kurdishMarketAlternative === 'object' && treatment.kurdishMarketAlternative.priceGuide && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                                    {treatment.kurdishMarketAlternative.priceGuide}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-black leading-tight" style={{ color: 'var(--text)' }}>
                                {typeof treatment.kurdishMarketAlternative === 'object'
                                  ? (treatment.kurdishMarketAlternative.brandName || treatment.kurdishMarketAlternative.englishName)
                                  : String(treatment.kurdishMarketAlternative)}
                              </p>
                              {typeof treatment.kurdishMarketAlternative === 'object' && (
                                <p className="text-[9px] font-bold leading-normal" style={{ color: 'var(--text3)' }}>
                                  {treatment.kurdishMarketAlternative.reason} · {treatment.kurdishMarketAlternative.availability}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GPS Location Finder */}
          <GpsNearby />
        </div>

        {/* PDF Report Preview Modal */}
        {showPdfModal && <PdfReportModal data={data} onClose={() => setShowPdfModal(false)} />}
      </div>
    );
  }

  // Standard Result View
  return (
    <div
      className="min-h-full pb-8 font-sans transition-colors duration-200"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
      dir="rtl"
    >
      {/* Navigation Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 border-b transition-colors print:hidden"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        }}
      >
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center z-10">
            <button
              onClick={onBack}
              className="p-2 rounded-full transition-transform active:scale-90 flex items-center justify-center border"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              title="زڤڕین"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-black text-sm md:text-base tracking-tight" style={{ color: 'var(--text)' }}>
              ئەنجامێ شیکاریێ
            </span>
          </div>

          <div className="flex items-center gap-1.5 z-10">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              title="کۆپیکرن"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <DynamicIcon name="copy" size={16} />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              title="شیرکرن"
            >
              {shared ? <Check size={16} className="text-blue-500" /> : <DynamicIcon name="share" size={16} />}
            </button>
            <button
              onClick={handlePdf}
              className="p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              title="ڕاپۆرتا PDF"
            >
              <DynamicIcon name="pdf" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 space-y-3.5 print:pt-0"
        style={{ paddingBottom: 'max(110px, calc(env(safe-area-inset-bottom, 20px) + 80px))' }}
      >
        {/* Header Card with Medical Disease Image (Compact & Elegant) */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border flex flex-col justify-between"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.04)',
          }}
        >
          {/* Medical condition illustration image (100% Full Cover - No Gaps) */}
          <div className="relative w-full h-32 md:h-36 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <img
              src={displayImageUrl}
              alt={data.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (!imageError) {
                  setImageError(true);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                transform: 'scale(1.15)',
              }}
              className="transition-transform duration-700 hover:scale-120"
            />
            {/* Smooth gradient blend into card surface */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, var(--surface) 0%, rgba(0,0,0,0.35) 65%, transparent 100%)',
              }}
            />
          </div>

          <div className="p-4 pt-2.5">
            <div>
              <h1 className="text-lg md:text-xl font-black mb-0.5 tracking-tight leading-snug" style={{ color: 'var(--text)' }}>
                {data.name}
              </h1>
              {data.englishSubtitle && (
                <p className="text-xs font-bold" style={{ color: 'var(--text2)' }} dir="auto">
                  {data.englishSubtitle}
                </p>
              )}
            </div>

            <div className="flex justify-between items-end mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>
                ستانداردێ پزیشکی (WHO / FDA)
              </span>
              {data.rating && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      fill={star <= data.rating ? "#f59e0b" : "transparent"}
                      color={star <= data.rating ? "#f59e0b" : "var(--border)"}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - Apple Health iOS Design */}
        <div className="grid grid-cols-2 gap-2.5">
          {(data.stats || []).map((stat, idx) => {
            const getStatIcon = () => {
              if (stat.icon) return stat.icon;
              const lbl = (stat.label + ' ' + stat.value).toLowerCase();
              if (lbl.includes('ڕێژە') || lbl.includes('٪') || lbl.includes('جێندەر') || lbl.includes('مێ')) return 'users';
              if (lbl.includes('خەو') || lbl.includes('دەمژمێر')) return 'moon';
              if (lbl.includes('ئاڤ') || lbl.includes('کارتێکرن') || lbl.includes('خولەک')) return 'clock';
              if (lbl.includes('کافاین') || lbl.includes('ملگم')) return 'zap';
              if (lbl.includes('دەرمان') || lbl.includes('ڕۆژ')) return 'pill';
              if (lbl.includes('پزیشک') || lbl.includes('سەردان')) return 'stethoscope';
              if (lbl.includes('گرژی') || lbl.includes('سەرئێشان')) return 'activity';
              return 'shield';
            };

            const iconName = getStatIcon();

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedStat(getStatDetails(stat, data.name));
                }}
                className="rounded-2xl p-3 flex flex-col justify-between text-right border transition-all duration-200 active:scale-[0.96] shadow-xs cursor-pointer group"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  minHeight: '82px',
                }}
              >
                {/* Top row with subtle icon pill */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className="text-[10px] font-bold tracking-wide leading-tight line-clamp-1 group-hover:opacity-80 transition-opacity"
                    style={{
                      color: 'var(--accent)',
                      fontSize: 'clamp(0.58rem, 2.4vw, 0.68rem)',
                    }}
                  >
                    {stat.label}
                  </span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      background: 'var(--bg2)',
                      color: 'var(--accent)',
                    }}
                  >
                    <DynamicIcon name={iconName} size={12} />
                  </div>
                </div>

                {/* Main value */}
                <div
                  className="font-black tracking-tight leading-snug"
                  style={{
                    color: 'var(--text)',
                    fontSize: 'clamp(0.75rem, 3.2vw, 0.88rem)',
                    wordBreak: 'break-word',
                  }}
                  dir="auto"
                >
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Description Card */}
        <div
          className="rounded-2xl p-4 md:p-5 border shadow-xs transition-all"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent)',
                }}
              >
                <DynamicIcon name="file-text" size={14} />
              </div>
              <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text)' }}>
                شلوڤەکرنا تەمام و هویراتی
              </h3>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                background: 'var(--bg2)',
                borderColor: 'var(--border)',
                color: 'var(--text3)',
              }}
            >
              پوختە
            </span>
          </div>
          <p className="leading-relaxed text-xs md:text-sm text-justify font-semibold" style={{ color: 'var(--text2)' }}>
            {cleanText(data.description)}
          </p>
        </div>

        {/* Sections Grid */}
        <div className="space-y-3 print:space-y-2">
          {(data.sections || []).map((section, idx) => (
            <div
              key={idx}
              className="border rounded-2xl p-4 shadow-xs transition-all"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      background: 'var(--bg2)',
                      borderColor: 'var(--border)',
                      color: 'var(--accent)',
                    }}
                  >
                    <DynamicIcon name={section.icon || "info"} size={14} />
                  </div>
                  <h3 className="font-black text-xs md:text-sm tracking-tight" style={{ color: 'var(--text)' }}>
                    {section.title}
                  </h3>
                </div>
                <span
                  className="text-[10px] font-black w-5 h-5 rounded-lg flex items-center justify-center border"
                  style={{
                    background: 'var(--bg2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text3)',
                  }}
                >
                  {idx + 1}
                </span>
              </div>
              <div
                className="text-xs md:text-sm leading-relaxed whitespace-pre-line text-justify font-semibold pt-2 border-t"
                style={{
                  color: 'var(--text2)',
                  borderColor: 'var(--border)',
                }}
              >
                {cleanText(section.content)}
              </div>
            </div>
          ))}
        </div>

        {/* References */}
        {data.references && data.references.length > 0 && (
          <div
            className="rounded-2xl p-4 border shadow-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center border"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent)',
                }}
              >
                <DynamicIcon name="link" size={12} />
              </div>
              <h3 className="font-black text-xs" style={{ color: 'var(--text)' }}>
                ژێدەرێن فەرمی یێن پزیشکی
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ref-link flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-transform active:scale-95 border"
                  style={{
                    background: 'var(--bg2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text2)',
                    fontFamily: "var(--font-en, 'Inter', sans-serif)",
                  }}
                >
                  <span dir="ltr" className="font-en" style={{ fontFamily: "var(--font-en, 'Inter', sans-serif)", fontWeight: 600 }}>
                    {ref.name}
                  </span>
                  <DynamicIcon name="link" size={11} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* GPS Location Finder */}
        <GpsNearby />
      </div>

      {/* ── iOS Modal Bottom Sheet for Stats Detail (About Sheet Style) ── */}
      {selectedStat && (
        <div
          className="cfg-sheet-overlay"
          onClick={() => setSelectedStat(null)}
          style={{ zIndex: 99998 }}
        >
          <div
            className="cfg-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateY(${sheetTranslateY}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.32, 1, 0.56, 1)',
              zIndex: 99999,
            }}
          >
            {/* Pull handle for iOS drag to dismiss */}
            <div className="cfg-sheet-pull" />

            {/* Header */}
            <div className="cfg-sheet-hdr">
              <div className="cfg-sheet-title">شیکاریا زانستی یا ئامارێ</div>
              <button
                className="cfg-sheet-close"
                onClick={() => setSelectedStat(null)}
                aria-label="داخستن"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div className="cfg-sheet-body" dir="rtl">
              {/* Hero Stat Box */}
              <div
                className="rounded-2xl p-4 text-center border flex flex-col items-center justify-center gap-1"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="text-xl md:text-2xl font-black"
                  style={{ color: 'var(--text)' }}
                >
                  {selectedStat.value}
                </div>
                <div
                  className="text-xs font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  {selectedStat.title}
                </div>
              </div>

              {/* Detailed Explanation */}
              <div
                className="rounded-2xl p-4 border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-4 rounded-full" style={{ background: 'var(--accent)' }} />
                  <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    شلوڤەکرنا پزیشکی و کاریگەری
                  </h3>
                </div>
                <p
                  className="text-xs leading-relaxed font-semibold text-justify"
                  style={{ color: 'var(--text2)' }}
                >
                  {selectedStat.desc}
                </p>
              </div>

              {/* Advices List */}
              <div
                className="rounded-2xl p-4 border space-y-2"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <h3 className="text-xs font-black flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  <ShieldCheck size={15} />
                  <span>{selectedStat.adviceTitle}</span>
                </h3>
                <div className="space-y-2">
                  {selectedStat.advices.map((adv: string, aIdx: number) => (
                    <div key={aIdx} className="flex items-start gap-2 text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Tag */}
              <div className="text-center pt-1 pb-4">
                <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>
                  ژێدەرێ زانستی: {selectedStat.source}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Preview Modal */}
      {showPdfModal && <PdfReportModal data={data} onClose={() => setShowPdfModal(false)} />}
    </div>
  );
};

export default ResultDashboard;
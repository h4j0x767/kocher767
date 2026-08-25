import React, { useState, useEffect, useRef } from 'react';
import { 
  Pill, Plus, Check, Clock, Calendar, AlertCircle, 
  Trash2, Bell, BellOff, ArrowRight, ShieldCheck, RefreshCw,
  Flame, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  FlaskConical, Syringe, Droplets, Wind, Sun, Sunrise, Sunset, Moon,
  Utensils, FileText, X, Camera, Image as ImageIcon, Search, Eye, Loader2,
  Stethoscope, BookOpen, Activity, Zap
} from 'lucide-react';
import { analyzeMedicalQuery, identifyMedicationFromImage } from '../services/geminiService';
import { MedicalData } from '../types';

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  type: 'pill' | 'syrup' | 'injection' | 'drops' | 'cream' | 'inhaler';
  times: string[]; // ["08:00", "20:00"]
  timeSlots: ('morning' | 'noon' | 'evening' | 'night')[];
  foodRelation: 'before' | 'after' | 'with' | 'independent';
  color: string;
  image?: string;
  notes?: string;
  startDate: number;
  totalDays?: number;
  active: boolean;
  takenHistory: Record<string, boolean>; // key: "YYYY-MM-DD_HH:MM" -> boolean
}

interface MedicationTrackerPanelProps {
  darkMode?: boolean;
  onBack?: () => void;
  showToast?: (title: string, body: string, type?: 'info' | 'success' | 'alert' | 'ai') => void;
  onOpenMedicationDetails?: (medName: string) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

// Visual product image database for popular medications
const MED_IMAGE_PRESETS: Record<string, string> = {
  'panadol extra': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  'panadol': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  'amoxicillin': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60',
  'augmentin': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60',
  'vitamin d3': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=60',
  'vitamin d': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=60',
  'paracetamol': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  'brufen': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60',
  'aspirin': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=500&auto=format&fit=crop&q=60',
  'omeprazole': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60',
  'zinc': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=60',
  'pill': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  'syrup': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&auto=format&fit=crop&q=60',
  'injection': 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=500&auto=format&fit=crop&q=60',
  'drops': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60',
  'inhaler': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60',
  'cream': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
};

export const getMedicationAutoImage = (name: string, type: string): string => {
  const clean = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(MED_IMAGE_PRESETS)) {
    if (clean.includes(key)) return url;
  }
  if (MED_IMAGE_PRESETS[type]) return MED_IMAGE_PRESETS[type];
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60';
};

interface TypeDosageConfig {
  label: string;
  defaultDosage: string;
  placeholder: string;
  chips: string[];
}

export const DOSAGE_PRESETS_BY_TYPE: Record<MedicationItem['type'], TypeDosageConfig> = {
  pill: {
    label: 'قەبارەیا حەبکێ / کەپسوولێ:',
    defaultDosage: '٥٠٠ ملغ',
    placeholder: 'بۆ نموونە: ٥٠٠ ملغ یان ١ کەپسوول',
    chips: ['٥٠٠ ملغ', '١٠٠٠ ملغ', '٢٥٠ ملغ', '١ حەبک', '٢ حەبک', '١ کەپسوول'],
  },
  syrup: {
    label: 'قەبارەیا شربەتێ / شلەیی:',
    defaultDosage: '١ کەڤچک (5ml)',
    placeholder: 'بۆ نموونە: ١ کەڤچکێ خوارنێ (5ml)',
    chips: ['١ کەڤچک (5ml)', '٢ کەڤچک (10ml)', '١ کەڤچکێ چایێ (2.5ml)', '١٥ مل', '٢٠ مل', '١ قەپاخ'],
  },
  injection: {
    label: 'قەبارە و هێزا دەرزیێ:',
    defaultDosage: '١ ئەمپوول',
    placeholder: 'بۆ نموونە: ١ ئەمپوول یان ١٠ یەکینە',
    chips: ['١ ئەمپوول', '١ دەرزی (1ml)', '٥٠٠ ملغ', '١٠٠٠ ملغ', '١٠ یەکینە (ئینسۆلین)', '٢٠ یەکینە'],
  },
  drops: {
    label: 'ژمارەیا دلوپان:',
    defaultDosage: '٢ دلوپ',
    placeholder: 'بۆ نموونە: ٢ دلوپ د هەردوو چاڤان دا',
    chips: ['١ دلوپ', '٢ دلوپ', '٣ دلوپ', '٥ دلوپ', '١ دڵۆپەر', 'دلوپەک هەر چاڤەکی'],
  },
  inhaler: {
    label: 'ژمارەیا بەخان (Puffs):',
    defaultDosage: '١ بەخ (Puff)',
    placeholder: 'بۆ نموونە: ٢ بەخ (Puffs)',
    chips: ['١ بەخ (Puff)', '٢ بەخ (Puffs)', '٣ بەخ', '١٠٠ مکغ', '٢٠٠ مکغ', 'ل دەمێ پێدڤی'],
  },
  cream: {
    label: 'شێواز و قەبارەیا مەرهەمێ:',
    defaultDosage: 'چینەکا تەنک',
    placeholder: 'بۆ نموونە: چینەکا تەنک ل سەر جهێ برینێ',
    chips: ['چینەکا تەنک', 'ل سەر برینێ', '١ چەسپ', 'رۆژانە ٢ جاران', 'شەڤێ پێش خەوێ', 'ل سەر پێستێ پاقژ'],
  },
};

export const detectMedicationTypeFromName = (name: string): MedicationItem['type'] | null => {
  const lower = name.toLowerCase().trim();
  if (lower.match(/syrup|liquid|suspension|شربەت|گیراوە|شروپ/)) return 'syrup';
  if (lower.match(/inhaler|spray|puff|ventolin|salbutamol|بەخاخ|سپرێ|بەخ/)) return 'inhaler';
  if (lower.match(/injection|inj|ampoule|vial|insulin|دەرزی|ئەمپوول|ئینسۆلین/)) return 'injection';
  if (lower.match(/drops|drop|eye|ear|nasal|otex|دلوپ|دڵۆپ|قترە/)) return 'drops';
  if (lower.match(/cream|ointment|gel|lotion|paste|hydrocortisone|مەرهەم|کرێم|مەڵهەم/)) return 'cream';
  if (lower.match(/tablet|tab|cap|capsule|pill|panadol|paracetamol|amoxicillin|augmentin|brufen|vitamin|حەب|کەپسوول/)) return 'pill';
  return null;
};

export const getInstantMedicineAnalysis = (name: string, type: string, dosage?: string): MedicalData => {
  const clean = name.toLowerCase().trim();

  if (clean.includes('panadol') || clean.includes('paracetamol')) {
    return {
      type: 'medicine',
      name: 'پەنادۆڵ (Panadol Extra / Paracetamol)',
      englishSubtitle: 'Analgesic & Antipyretic',
      rating: 4.8,
      description: 'پەنادۆڵ ئێک ژ باوەرپێکراوترین دەرمانێن جیهانێ یە بۆ کێمکرنا ئێشان و دانانا تاێ. ئەڤ دەرمانە ب رێکەکا ئێمن کار دکەت ل سەر دەمارێن لەشی بێی کو زیانێ ب گەدەی بگەهینیت.',
      stats: [
        { label: 'کاریگەری', subLabel: 'Efficacy', value: '٩٥٪ بلەز', icon: 'zap', color: 'green' },
        { label: 'دەمێ مانێ', subLabel: 'Duration', value: '٤-٦ دەمژمێر', icon: 'clock', color: 'blue' },
      ],
      treatments: [
        { name: 'پەنادۆڵ سوور (Extra)', dosage: '٥٠٠ ملغ پەرەسیتامۆڵ + ٦٥ ملغ کافایین', description: 'بۆ ژانەسەرێن گران و ئێشێن لەشی', kurdishMarketAlternative: 'Adol Extra یان Paracap' },
        { name: 'پەنادۆڵ شین (Advance)', dosage: '٥٠٠ ملغ پەرەسیتامۆڵ', description: 'بۆ تایێ و ژانەسەرا سادە', kurdishMarketAlternative: 'Adol 500mg' },
      ],
      sections: [
        { title: 'مفا و بکارئینانێن سەرەکی', content: 'ئێشێن سەرئێشێ، میگرێن، ئێشا ددانا، ئێشا پشتێ و ماسوولکان، و دانانا تایێ پشتی هەوکردن یان پەسیوێ.', icon: 'check', colorClass: 'green' },
        { title: 'ئاگەهداری و ڕێنماییێن گرنگ', content: 'پێدڤیە ڕۆژانە پتر ژ ٤٠٠٠ ملغ (٨ حەبکان) نەهێنە خوارن بۆ پاراستنا جگەری. پێش خوارنێ یان پشتی خوارنێ دگەل ئاڤەکا زۆر بهێتە خوارن.', icon: 'alert', colorClass: 'amber' },
        { title: 'هاوتا و بەدیل ل کوردستانێ', content: 'ل دەرمانخانێن کوردستانێ دەرمانێن هاوتا یێن ئەدول (Adol)، پاراسیتامۆل (Paracetamol)، و ڕێڤانین (Revanin) ب هەمان کاریگەری بەردەستن.', icon: 'pill', colorClass: 'blue' }
      ]
    };
  }

  if (clean.includes('amoxicillin') || clean.includes('augmentin') || clean.includes('antibiotic')) {
    return {
      type: 'medicine',
      name: 'ئەمۆکسیسیلین / ئۆگمێنتین (Amoxicillin / Augmentin)',
      englishSubtitle: 'Broad-Spectrum Antibiotic',
      rating: 4.6,
      description: 'ئەنتی بایۆتیکەکێ بهێزە بۆ ژناڤبرنا بەکتریایێن زیانبەخش د لەشی دا. زۆر ب مفا یە بۆ هەوکردنا گەرووی، سیهان، گوھ و رێڕەوێ میزێ.',
      stats: [
        { label: 'کاریگەری', subLabel: 'Efficacy', value: '٩٢٪ بهێز', icon: 'zap', color: 'green' },
        { label: 'خول خوارنێ', subLabel: 'Course', value: '٥-٧ ڕۆژ', icon: 'clock', color: 'blue' },
      ],
      treatments: [
        { name: 'ئۆگمێنتین 1g', dosage: '١٠٠٠ ملغ', description: 'هەوکردنێن بهێز یێن گەرووی و سیهان', kurdishMarketAlternative: 'Amoxiclav یان Curam' },
        { name: 'ئەمۆکسیسیلین 500mg', dosage: '٥٠٠ ملغ', description: 'هەوکردنا ددان و گوهێ ناڤین', kurdishMarketAlternative: 'Amoxil' },
      ],
      sections: [
        { title: 'مفا و بکارئینان', content: 'چارەسەریا هەوکردنا سیهان (Pneumonia)، تا و هەوکردنا گەرووی، هەوکردنا گوهان و هەوکردنێن بەکتریایی.', icon: 'check', colorClass: 'green' },
        { title: 'ئاگەهداری یا دەمژمێران', content: 'پێدڤیە دەمژمێرێن خوارنێ (هەر ٨ یان ١٢ دەمژمێران) ب ڕێکی بهێنە پاراستن و خولێ دەرمانی ب تەمامی خلاس ببیت.', icon: 'alert', colorClass: 'amber' },
        { title: 'بەدیلێن ل بازاڕێ کوردستانێ', content: 'دەرمانێن کیورام (Curam)، کلاڤۆکس (Klavox)، و یۆنیمۆکس (Unimox) ب هەمان مادەیێ چالاک ل دەرمانخانان بەردەستن.', icon: 'pill', colorClass: 'blue' }
      ]
    };
  }

  if (clean.includes('cream') || clean.includes('johnson') || clean.includes('soft') || clean.includes('مەرهەم') || type === 'cream') {
    return {
      type: 'medicine',
      name: name || 'کرێم و مەرهەم (Topical Care Cream)',
      englishSubtitle: 'Dermatological Moisturizing & Healing Agent',
      rating: 4.7,
      description: 'کرێم و مەرهەمەکا نەرمکەر و پارێزەرە بۆ پێستی، هاریاریا نویکرن و شێدارکرنا خانەیێن پێستێ زوها و بریندار دکەت و لەشی ژ وشکاتیێ و سووربوونێ دپارێزیت.',
      stats: [
        { label: 'شێدارکرن', subLabel: 'Hydration', value: '٢٤ دەمژمێر', icon: 'zap', color: 'green' },
        { label: 'گونجاندن', subLabel: 'Skin Safety', value: '١٠٠٪ ئێمن', icon: 'clock', color: 'blue' },
      ],
      treatments: [
        { name: 'Johnson Soft Cream', dosage: 'چینەکا تەنک', description: 'بۆ شێدارکرن و نەرمکرنا رووی و لەشی', kurdishMarketAlternative: 'Nivea Soft یان CeraVe Cream' },
        { name: 'Panthenol Cream', dosage: 'رۆژانە ٢ جاران', description: 'بۆ چاکبوون و ساڕێژکرنا برین و سووتانێ', kurdishMarketAlternative: 'Bepanthen' },
      ],
      sections: [
        { title: 'شێوازێ بکارئینانێ', content: 'چینەکا تەنک ل سەر پێستێ پاقژ و هشک بهێتە دانان و ب نەرمی بهێتە مالین هەتا مژینێ.', icon: 'check', colorClass: 'green' },
        { title: 'ئاگەهداری و پاراستن', content: 'نەهێتە بەرکەفتن دگەل ناڤا چاڤان و ل جهەکێ فێنک و دویر ژ ڕۆژێ بهێتە پاراستن.', icon: 'alert', colorClass: 'amber' },
        { title: 'بەدیلێن ل کوردستانێ', content: 'کرێمێن بیپانتین (Bepanthen)، سیراڤی (CeraVe)، و نیڤیا سۆفت (Nivea) ل دەرمانخانان ب فرەهی بەردەستن.', icon: 'pill', colorClass: 'blue' }
      ]
    };
  }

  // Generic Dynamic Clinical Template for Any Medication
  return {
    type: 'medicine',
    name: name,
    englishSubtitle: `Clinical Pharmacological Overview (${dosage || 'Standard Dose'})`,
    rating: 4.5,
    description: `دەرمانێ ${name} ئێک ژ دەرمانێن باوەرپێکری یە د وارێ پزیشکی دا کو بۆ چاڤدێری و چارەسەریا نیشانان و ساخلەمیا لەشی دهێتە بکارئینان.`,
    stats: [
      { label: 'پلەیا ئێمنیێ', subLabel: 'Safety', value: 'باوەرپێکری', icon: 'zap', color: 'green' },
      { label: 'شێوازێ پێدڤی', subLabel: 'Administration', value: dosage || 'ل دویڤ ڕەچەتێ', icon: 'clock', color: 'blue' },
    ],
    treatments: [
      { name: `${name} (Original Brand)`, dosage: dosage || '١ دانە', description: 'دەرمانێ سەرەکی یێ دیارکری', kurdishMarketAlternative: 'هاوتایێ ژێدەرێن باوەرپێکری ل کوردستانێ' }
    ],
    sections: [
      { title: 'شێوازێ بکارئینانێ و ڕێنمایی', content: `پێدڤیە ل دویڤ دەمژمێرێن خشتەیی و دگەل ئاڤێ ب شێوەیەکێ دروست بهێتە وەرگرتن.`, icon: 'check', colorClass: 'green' },
      { title: 'ئاگەهداریێن پزیشکی', content: `ئەگەر هەستیاری (ئەلێرجی) یان کێشەیا دل و گولیچکان هەبیت، پێدڤیە دگەل نۆژداری ڕاوێژ بهێتە کرن.`, icon: 'alert', colorClass: 'amber' },
      { title: 'هاوتا و بەدیل ل دەرمانخانێن کوردستانێ', content: `ل دەرمانخانێن هەرێما کوردستانێ دەرمانێن هاوتا ب هەمان مادەیێ کاریگەر بەردەستن.`, icon: 'pill', colorClass: 'blue' }
    ]
  };
};

const DEFAULT_MEDS: MedicationItem[] = [
  {
    id: 'med_1',
    name: 'Panadol Extra',
    dosage: '٥٠٠ ملغ (١ حەبک)',
    type: 'pill',
    times: ['08:00', '20:00'],
    timeSlots: ['morning', 'evening'],
    foodRelation: 'after',
    color: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
    notes: 'بۆ ژانەسەرێ و ئێشێن لەشی',
    startDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    totalDays: 7,
    active: true,
    takenHistory: {},
  },
  {
    id: 'med_2',
    name: 'Amoxicillin',
    dosage: '٥٠٠ ملغ (١ کەپسوول)',
    type: 'pill',
    times: ['08:00', '16:00', '00:00'],
    timeSlots: ['morning', 'noon', 'night'],
    foodRelation: 'with',
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60',
    notes: 'ئەنتی بایۆتیک بۆ هەوکردنێ',
    startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
    totalDays: 10,
    active: true,
    takenHistory: {},
  },
  {
    id: 'med_3',
    name: 'Vitamin D3',
    dosage: '٥٠٠٠ یەکینە (١ حەبک)',
    type: 'pill',
    times: ['12:00'],
    timeSlots: ['noon'],
    foodRelation: 'after',
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=60',
    notes: 'پشتی خوارنا نیڤڕۆ بهێتە خوارن',
    startDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    totalDays: 30,
    active: true,
    takenHistory: {},
  },
];

export const MedicationTrackerPanel: React.FC<MedicationTrackerPanelProps> = ({
  darkMode = false,
  onBack,
  showToast,
  onOpenMedicationDetails,
  onModalStateChange,
}) => {
  const [meds, setMeds] = useState<MedicationItem[]>(() => {
    try {
      const saved = localStorage.getItem('dr_badini_medications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MEDS;
  });

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [analysisPromptMed, setAnalysisPromptMed] = useState<string | null>(null);
  const [selectedMedForAnalysis, setSelectedMedForAnalysis] = useState<MedicationItem | null>(null);
  const [isAnalyzingMed, setIsAnalyzingMed] = useState(false);

  // Lock background scroll when any modal is open (iOS-safe native approach)
  useEffect(() => {
    const isAnyModalOpen = Boolean(showAddSheet || selectedMedForAnalysis || analysisPromptMed || showSourcePicker);

    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.cfg-sheet') || target.closest('[data-allow-scroll]')) return;
      e.preventDefault();
    };

    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', preventScroll);
    }
    if (onModalStateChange) {
      onModalStateChange(isAnyModalOpen);
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [showAddSheet, selectedMedForAnalysis, analysisPromptMed, showSourcePicker, onModalStateChange]);
  const [medAnalysesCache, setMedAnalysesCache] = useState<Record<string, MedicalData>>(() => {
    try {
      const saved = localStorage.getItem('dr_badini_med_analyses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'morning' | 'noon' | 'evening' | 'night'>('all');
  const [streakDays, setStreakDays] = useState<number>(4);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('med_notifications_enabled') !== 'false';
  });

  // Open Medical Analysis bottom sheet with instant caching and local fallback
  const handleOpenMedAnalysis = async (med: MedicationItem) => {
    triggerHaptic('medium');
    setSelectedMedForAnalysis(med);
    const key = med.name.toLowerCase().trim();

    // 1. If already cached, open instantly!
    if (medAnalysesCache[key]) {
      return;
    }

    // 2. Immediately provide rich clinical template so sheet is NEVER blank or empty!
    const instantData = getInstantMedicineAnalysis(med.name, med.type, med.dosage);
    setMedAnalysesCache(prev => {
      const updated = { ...prev, [key]: instantData };
      try {
        localStorage.setItem('dr_badini_med_analyses', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Fetch enhanced AI analysis in the background
    try {
      const result = await analyzeMedicalQuery(med.name);
      if (result && result.description) {
        setMedAnalysesCache(prev => {
          const updated = { ...prev, [key]: result };
          try {
            localStorage.setItem('dr_badini_med_analyses', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.log('Using instant clinical fallback:', err);
    }
  };

  // iOS Sheet drag state
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartY = useRef(0);

  // File and camera inputs refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

  // Add medication form state
  const [newMedType, setNewMedType] = useState<MedicationItem['type']>('pill');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('٥٠٠ ملغ');
  const [newMedFrequency, setNewMedFrequency] = useState<'1x' | '2x' | '3x' | 'needed'>('2x');
  const [newMedTimes, setNewMedTimes] = useState<string[]>(['08:00', '20:00']);
  const [newMedFood, setNewMedFood] = useState<MedicationItem['foodRelation']>('after');
  const [newMedImage, setNewMedImage] = useState<string | null>(null);
  const [newMedNotes, setNewMedNotes] = useState('');

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      localStorage.setItem('dr_badini_medications', JSON.stringify(meds));
    } catch {}
  }, [meds]);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingSheet) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) {
      setSheetDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (sheetDragY > 120) {
      triggerHaptic('light');
      setShowAddSheet(false);
    }
    setSheetDragY(0);
    setIsDraggingSheet(false);
  };

  // Image Upload and Camera Handler with instant AI recognition
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('medium');
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target?.result as string;
      setNewMedImage(base64Data);

      setIsScanningImage(true);
      if (showToast) {
        showToast('شیکاریا AI', 'زیرەکیا دەستکرد یێ ناڤ و زانیاریێن دەرمانی دبینیت...', 'ai');
      }

      try {
        const recognized = await identifyMedicationFromImage(base64Data);
        if (recognized && recognized.name) {
          setNewMedName(recognized.name);
          
          // Auto switch type to match AI result or inferred name
          const detectedType: MedicationItem['type'] = (recognized.type && DOSAGE_PRESETS_BY_TYPE[recognized.type])
            ? recognized.type
            : (detectMedicationTypeFromName(recognized.name) || 'pill');
          
          setNewMedType(detectedType);

          // Auto update dosage
          const finalDosage = recognized.dosage || DOSAGE_PRESETS_BY_TYPE[detectedType].defaultDosage;
          setNewMedDosage(finalDosage);

          if (recognized.notes) {
            setNewMedNotes(recognized.notes);
          }

          triggerHaptic('medium');
          if (showToast) {
            const typeBadiniMap: Record<string, string> = {
              pill: 'حەبک',
              syrup: 'شربەت',
              injection: 'دەرزی',
              drops: 'دلوپ',
              inhaler: 'بەخاخ',
              cream: 'مەرهەم'
            };
            showToast('دەرمان هاتە ناسین', `${recognized.name} (${typeBadiniMap[detectedType] || ''}) ب سەرکەفتی هاتە دیارکرن ✓`, 'success');
          }
        } else {
          // Fallback to filename if available
          const detectedName = file.name.split('.')[0].replace(/[-_]/g, ' ');
          if (detectedName && detectedName.length > 2 && !detectedName.startsWith('image')) {
            setNewMedName(detectedName);
            const inferred = detectMedicationTypeFromName(detectedName);
            if (inferred) {
              setNewMedType(inferred);
              setNewMedDosage(DOSAGE_PRESETS_BY_TYPE[inferred].defaultDosage);
            }
          }
        }
      } catch (err) {
        console.error('Scan error:', err);
      } finally {
        setIsScanningImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to check if scheduled dose time has arrived
  const isTimeReached = (timeStr: string): boolean => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [hoursStr, minutesStr] = timeStr.split(':');
    const doseHours = parseInt(hoursStr, 10) || 0;
    const doseMinutes = parseInt(minutesStr, 10) || 0;
    const scheduledMinutes = doseHours * 60 + doseMinutes;

    return currentMinutes >= scheduledMinutes;
  };

  const toggleMedTaken = (medId: string, time: string) => {
    const key = `${todayKey}_${time}`;
    const targetMed = meds.find((m) => m.id === medId);
    const isCurrentlyTaken = targetMed ? !!targetMed.takenHistory[key] : false;

    // Disallow marking as taken before the scheduled time arrives
    if (!isCurrentlyTaken && !isTimeReached(time)) {
      triggerHaptic('heavy');
      if (showToast) {
        showToast('هێشتا دەم نەگەهشتیە', `دەمێ خوارنا ڤێ ژەمێ ل دەمژمێر ${time} یە. چاڤەڕێ بە هەتا دەم بهێت.`, 'alert');
      }
      return;
    }

    triggerHaptic('medium');
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        const current = !!m.takenHistory[key];
        const updatedHistory = { ...m.takenHistory, [key]: !current };
        return { ...m, takenHistory: updatedHistory };
      })
    );

    if (showToast) {
      showToast('چاڤدێریا دەرمانی', 'دۆخێ خوارنا دەرمانی هاتە نویکرن ✓', 'success');
    }
  };

  const handleDeleteMed = (medId: string) => {
    triggerHaptic('medium');
    setMeds((prev) => prev.filter((m) => m.id !== medId));
    if (showToast) {
      showToast('ژێبرن', 'دەرمان ژ خشتەی هاتە ژێبرن', 'info');
    }
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) {
      if (showToast) showToast('ناڤێ دەرمانی', 'هیڤیە ناڤێ دەرمانی بنڤیسە', 'alert');
      return;
    }

    const slots: ('morning' | 'noon' | 'evening' | 'night')[] = [];
    newMedTimes.forEach((t) => {
      const hour = parseInt(t.split(':')[0], 10);
      if (hour >= 5 && hour < 12) slots.push('morning');
      else if (hour >= 12 && hour < 17) slots.push('noon');
      else if (hour >= 17 && hour < 22) slots.push('evening');
      else slots.push('night');
    });

    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    // If user didn't upload custom camera photo, auto-find image from database
    const finalImage = newMedImage || getMedicationAutoImage(newMedName, newMedType);

    const newMed: MedicationItem = {
      id: 'med_' + Date.now().toString(36),
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '١ حەبک',
      type: newMedType,
      times: newMedTimes,
      timeSlots: Array.from(new Set(slots)),
      foodRelation: newMedFood,
      color: chosenColor,
      image: finalImage,
      notes: newMedNotes.trim(),
      startDate: Date.now(),
      active: true,
      takenHistory: {},
    };

    triggerHaptic('medium');
    const addedMedName = newMed.name;
    setMeds((prev) => [newMed, ...prev]);
    setShowAddSheet(false);

    // Reset Form
    setNewMedName('');
    setNewMedDosage('٥٠٠ ملغ');
    setNewMedImage(null);
    setNewMedNotes('');

    if (showToast) {
      showToast('دەرمان هاتە زێدەکرن', `${addedMedName} ب سەرکەفتی هاتە تۆمارکرن ✓`, 'success');
    }

    // Ask if the user wants comprehensive AI medical explanation about the added medication
    setTimeout(() => {
      setAnalysisPromptMed(addedMedName);
    }, 350);
  };

  // Calculations
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  meds.forEach((m) => {
    if (!m.active) return;
    m.times.forEach((t) => {
      totalDosesToday++;
      if (m.takenHistory[`${todayKey}_${t}`]) {
        takenDosesToday++;
      }
    });
  });

  const progressPercent = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;

  const kurdishWeekDays = [
    { name: 'شەم', full: 'شەممە', done: true },
    { name: 'ئێک', full: 'ئێک شەمب', done: true },
    { name: 'دوو', full: 'دوو شەمب', done: true },
    { name: 'سێ', full: 'سێ شەمب', done: true },
    { name: 'چوار', full: 'چوار شەمب', done: takenDosesToday === totalDosesToday && totalDosesToday > 0, today: true },
    { name: 'پێنج', full: 'پێنج شەمب', done: false },
    { name: 'ئەین', full: 'ئەینی', done: false },
  ];

  const renderTypeIcon = (type: MedicationItem['type'], size = 18) => {
    switch (type) {
      case 'syrup': return <FlaskConical size={size} />;
      case 'injection': return <Syringe size={size} />;
      case 'drops': return <Droplets size={size} />;
      case 'cream': return <ShieldCheck size={size} />;
      case 'inhaler': return <Wind size={size} />;
      default: return <Pill size={size} />;
    }
  };

  const getFoodText = (food: MedicationItem['foodRelation']) => {
    switch (food) {
      case 'before': return 'پێش خوارنێ';
      case 'after': return 'پشتی خوارنێ';
      case 'with': return 'دگەل خوارنێ';
      default: return 'بێ مەرجێ خوارنێ';
    }
  };

  // Resolved dynamic preview image when user types or uploads
  const currentPreviewImage = newMedImage || (newMedName.trim() ? getMedicationAutoImage(newMedName, newMedType) : null);

  return (
    <div
      className="medication-tracker min-h-screen pb-20"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      dir="rtl"
    >
      {/* Hidden File / Camera Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      
      {/* ── STICKY HEADER (iOS Native Glass) ── */}
      <div
        className="sticky top-0 z-30 transition-all border-b"
        style={{
          background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        }}
      >
        <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onBack();
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                title="زڤڕین"
              >
                <ChevronRight size={18} />
              </button>
            )}
            <div>
              <h1 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Clock size={18} className="text-emerald-500" />
                <span>بیرئانینا دەرمانان</span>
              </h1>
              <p className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>
                خشتە و چاڤدێریکرنا خوارنا دەرمانان
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowAddSheet(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            style={{ background: 'var(--accent)', color: 'var(--accent-t, #ffffff)' }}
          >
            <Plus size={15} strokeWidth={3} />
            <span>دەرمانەکێ نوی</span>
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5 space-y-5">

        {/* ── 1. STREAK & COMPLIANCE HERO (TafsirKurd Style) ── */}
        <div
          className="rounded-[1.75rem] p-5 border shadow-sm relative overflow-hidden transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border text-amber-500"
                style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.25)' }}
              >
                <Flame size={24} className="fill-amber-500/20" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--text3)' }}>بەردەوامیا تە</div>
                <div className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {streakDays} ڕۆژ ل سەر ئێک
                </div>
              </div>
            </div>

            <div className="text-left">
              <div className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>ئەڤرۆ</div>
              <div className="text-sm font-black" style={{ color: 'var(--accent)' }}>
                {takenDosesToday} ژ {totalDosesToday} هاتینە خوارن ({progressPercent}٪)
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg2)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? '#10b981' : 'var(--accent)',
              }}
            />
          </div>

          {/* 7-Day Week Progress Circles (TafsirKurd reading-goal exact layout) */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {kurdishWeekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold" style={{ color: d.today ? 'var(--accent)' : 'var(--text3)' }}>
                  {d.name}
                </span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    d.done
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : d.today
                      ? 'border-2 border-dashed'
                      : 'border'
                  }`}
                  style={{
                    borderColor: d.today ? 'var(--accent)' : 'var(--border)',
                    background: d.done ? '#10b981' : 'var(--bg2)',
                    color: d.done ? '#ffffff' : d.today ? 'var(--accent)' : 'var(--text3)',
                  }}
                >
                  {d.done ? <Check size={14} strokeWidth={3} /> : d.today ? <Circle size={8} className="fill-current" /> : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. NOTIFICATIONS ALERT BANNER ── */}
        <div
          className="rounded-2xl p-3.5 border flex items-center justify-between gap-3 text-xs"
          style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm">
              <Bell size={16} />
            </div>
            <div>
              <div className="font-black" style={{ color: 'var(--text)' }}>ئاگاداریا دەمژمێرێ (Alarm)</div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>
                ناردنا نۆتیفیکەیشنان دەمێ خوارنا دەرمانی دەستپێدکەت
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              const next = !notificationsEnabled;
              setNotificationsEnabled(next);
              localStorage.setItem('med_notifications_enabled', String(next));
              if (showToast) {
                showToast('ئاگاداری', next ? 'ئاگاداری هاتنە چالاککرن' : 'ئاگاداری هاتنە ڕاوەستاندن', 'info');
              }
            }}
            className="w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0"
            style={{ background: notificationsEnabled ? 'var(--accent)' : 'var(--border2)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform"
              style={{
                right: notificationsEnabled ? '2px' : 'calc(100% - 22px)',
              }}
            />
          </button>
        </div>

        {/* ── 3. TIME SLOT FILTER CHIPS (Vector Icons) ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'هەمی دەرمان', icon: <Pill size={13} /> },
            { id: 'morning', label: 'سپێدێ', icon: <Sunrise size={13} /> },
            { id: 'noon', label: 'نیڤڕۆ', icon: <Sun size={13} /> },
            { id: 'evening', label: 'ئێڤارێ', icon: <Sunset size={13} /> },
            { id: 'night', label: 'شەڤێ', icon: <Moon size={13} /> },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedFilter(f.id as any);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedFilter === f.id ? 'shadow-sm scale-[1.02]' : 'opacity-70'
              }`}
              style={{
                background: selectedFilter === f.id ? 'var(--surface)' : 'transparent',
                borderColor: selectedFilter === f.id ? 'var(--accent)' : 'var(--border)',
                color: selectedFilter === f.id ? 'var(--text)' : 'var(--text2)',
              }}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* ── 4. MEDICATIONS LIST (With Real Pictures) ── */}
        <div className="space-y-3">
          {meds.length === 0 ? (
            <div className="text-center py-12 rounded-[2rem] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                <Pill size={24} />
              </div>
              <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>چ دەرمان نەهاتینە تۆمارکرن</h3>
              <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text3)' }}>
                بۆ زێدەکرنا خشتەیێ دەرمانان، کلیک ل سەر دوگمەیا سەری بکە
              </p>
            </div>
          ) : (
            meds
              .filter((m) => selectedFilter === 'all' || m.timeSlots.includes(selectedFilter as any))
              .map((med) => {
                const medImage = med.image || getMedicationAutoImage(med.name, med.type);

                return (
                  <div
                    key={med.id}
                    className="rounded-2xl p-4 border shadow-xs transition-all relative overflow-hidden group"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Real Visual Image Thumbnail */}
                        <div
                          onClick={() => medImage && setPreviewImage(medImage)}
                          className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner border relative group/img cursor-pointer active:scale-95 transition-transform"
                          style={{
                            borderColor: `color-mix(in srgb, ${med.color} 35%, var(--border))`,
                            background: 'var(--bg2)',
                          }}
                        >
                          <img
                            src={medImage}
                            alt={med.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye size={16} className="text-white" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-sm truncate" style={{ color: 'var(--text)' }}>
                              {med.name}
                            </h3>
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shrink-0"
                              style={{
                                background: 'var(--bg2)',
                                color: 'var(--text2)',
                              }}
                            >
                              {med.dosage}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text3)' }}>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              <span className="font-en">{med.times.join(' · ')}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Utensils size={11} />
                              <span>{getFoodText(med.foodRelation)}</span>
                            </span>
                          </div>

                          {med.notes && (
                            <p className="text-[11px] font-semibold italic pt-0.5 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                              <FileText size={11} />
                              <span>{med.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteMed(med.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="ژێبرن"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Dose action buttons & Medical Explanation at Bottom */}
                    <div className="mt-3.5 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {med.times.map((time) => {
                          const isTaken = !!med.takenHistory[`${todayKey}_${time}`];
                          const isReached = isTimeReached(time);

                          return (
                            <button
                              key={time}
                              onClick={() => toggleMedTaken(med.id, time)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all border active:scale-95 cursor-pointer ${
                                isTaken
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : isReached
                                  ? 'hover:border-slate-400'
                                  : 'opacity-65 hover:opacity-85'
                              }`}
                              style={{
                                background: isTaken
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'var(--bg2)',
                                borderColor: isTaken
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : 'var(--border)',
                                color: isTaken
                                  ? '#10b981'
                                  : isReached
                                  ? 'var(--text2)'
                                  : 'var(--text3)',
                              }}
                              title={isReached ? `دەستنیشانکرن` : `هێشتا دەمێ ${time} نەگەهشتیە`}
                            >
                              <span className="font-en">{time}</span>
                              <span className="flex items-center gap-1 text-[11px]">
                                {isTaken ? (
                                  <>
                                    <Check size={13} strokeWidth={3} />
                                    <span>خوار</span>
                                  </>
                                ) : isReached ? (
                                  <span>نەخوار</span>
                                ) : (
                                  <span className="opacity-80 text-[10px]">دەم نەهاتیە</span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Medical Analysis button moved to the bottom */}
                      <button
                        type="button"
                        onClick={() => handleOpenMedAnalysis(med)}
                        className="w-full py-2 px-3 rounded-xl text-[11px] font-black border transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 10%, var(--bg2))',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                        }}
                        title="شیکاریا پزیشکی یا هویر"
                      >
                        <Stethoscope size={13} />
                        <span>شیکاریا پزیشکی یا دەرمانی</span>
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

      </div>

      {/* ── IMAGE LIGHTBOX / PREVIEW MODAL ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 999999 }}
        >
          <div className="relative max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="w-full h-72 object-cover" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── EXACT TAFSIRKURD iOS BOTTOM SHEET MODAL (cfg-sheet) ── */}
      {showAddSheet && (
        <div
          className="cfg-sheet-overlay fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            triggerHaptic('light');
            setShowAddSheet(false);
          }}
          onTouchMove={(e) => e.preventDefault()}
          style={{ zIndex: 99998 }}
        >
          <div
            className="cfg-sheet w-full rounded-t-[2.5rem] border-t flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 duration-300"
            onClick={e => e.stopPropagation()}
            style={{
              zIndex: 99999,
              maxHeight: '88vh',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
              transform: `translateY(${sheetDragY}px)`,
              transition: isDraggingSheet ? 'none' : 'transform 0.25s cubic-bezier(0.32, 1, 0.56, 1)',
              paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
            }}
          >
            {/* iOS Top Pill Grab Handle */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="py-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
            >
              <div className="w-11 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 pb-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowAddSheet(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all active:scale-90 cursor-pointer"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text3)' }}
              >
                <X size={15} />
              </button>

              <h2 className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Pill size={16} className="text-emerald-500" />
                <span>زێدەکرنا دەرمانێ نوی</span>
              </h2>

              <div className="w-8"></div>
            </div>

            {/* Sheet Scrollable Body */}
            <form onSubmit={handleSaveMedication} className="overflow-y-auto p-5 space-y-4 flex-1">
              
              {/* 1. Types Grid */}
              <div>
                <label className="block text-xs font-black mb-2" style={{ color: 'var(--text)' }}>
                  ١. جۆرێ دەرمانی:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'pill', label: 'حەبک', icon: <Pill size={18} className="text-sky-500" /> },
                    { type: 'syrup', label: 'شربەت', icon: <FlaskConical size={18} className="text-emerald-500" /> },
                    { type: 'injection', label: 'دەرزی', icon: <Syringe size={18} className="text-rose-500" /> },
                    { type: 'drops', label: 'دلوپ', icon: <Droplets size={18} className="text-blue-500" /> },
                    { type: 'inhaler', label: 'بەخاخ', icon: <Wind size={18} className="text-indigo-500" /> },
                    { type: 'cream', label: 'مەرهەم', icon: <ShieldCheck size={18} className="text-amber-500" /> },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNewMedType(item.type as any);
                        setNewMedDosage(DOSAGE_PRESETS_BY_TYPE[item.type as MedicationItem['type']].defaultDosage);
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                        newMedType === item.type ? 'border-2 shadow-xs scale-[1.02]' : 'opacity-75 hover:opacity-100'
                      }`}
                      style={{
                        background: newMedType === item.type ? 'color-mix(in srgb, var(--accent) 12%, var(--bg2))' : 'var(--bg2)',
                        borderColor: newMedType === item.type ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      {newMedType === item.type && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-xs" style={{ background: 'var(--accent)' }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                      {item.icon}
                      <span className="text-[11px] font-black" style={{ color: 'var(--text)' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Drug Name & Dynamic Dosage in One Unified Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black mb-2" style={{ color: 'var(--text)' }}>
                    ٢. ناڤێ دەرمانی:
                  </label>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder={isScanningImage ? 'AI یێ ناڤێ دەرمانی دبینیت...' : 'بۆ نموونە: Panadol, Amoxicillin'}
                      value={newMedName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewMedName(val);
                        const inferred = detectMedicationTypeFromName(val);
                        if (inferred && inferred !== newMedType) {
                          setNewMedType(inferred);
                          setNewMedDosage(DOSAGE_PRESETS_BY_TYPE[inferred].defaultDosage);
                        }
                      }}
                      className="w-full py-3 rounded-2xl text-xs font-bold border outline-none font-en transition-all"
                      style={{
                        paddingRight: '1rem',
                        paddingLeft: currentPreviewImage ? '5.5rem' : '3.5rem',
                        background: 'var(--bg2)',
                        borderColor: isScanningImage ? 'var(--accent)' : 'var(--border)',
                        color: 'var(--text)'
                      }}
                    />

                    {/* Left Side: Thumbnail Preview + Camera Trigger */}
                    <div className="absolute left-2 flex items-center gap-1.5">
                      {currentPreviewImage && (
                        <div className="w-7 h-7 rounded-lg overflow-hidden border shadow-2xs" style={{ borderColor: 'var(--border)' }}>
                          <img src={currentPreviewImage} alt="Drug" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isScanningImage}
                        onClick={() => {
                          triggerHaptic('light');
                          setShowSourcePicker(true);
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-xs"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--accent)' }}
                        title="وێنە یان کامیرەیا دەرمانی"
                      >
                        {isScanningImage ? (
                          <Loader2 size={15} className="animate-spin text-emerald-500" />
                        ) : (
                          <Camera size={15} className="text-emerald-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick popular drug tags (Single Horizontal Row) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap mt-2">
                    {['Panadol Extra', 'Amoxicillin', 'Augmentin', 'Vitamin D3', 'Brufen', 'Zinc'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setNewMedName(tag);
                          const inferred = detectMedicationTypeFromName(tag);
                          if (inferred) {
                            setNewMedType(inferred);
                            setNewMedDosage(DOSAGE_PRESETS_BY_TYPE[inferred].defaultDosage);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                        style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text2)' }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Dosage & Presets in Single Horizontal Scrollable Row */}
                <div>
                  <label className="block text-xs font-black mb-2" style={{ color: 'var(--text)' }}>
                    ٣. {DOSAGE_PRESETS_BY_TYPE[newMedType].label}
                  </label>

                  {/* Single Row Horizontal Scrollable Chips without line break */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap mb-2">
                    {DOSAGE_PRESETS_BY_TYPE[newMedType].chips.map(dos => (
                      <button
                        key={dos}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setNewMedDosage(dos);
                        }}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          newMedDosage === dos ? 'shadow-sm scale-[1.02] border-2 font-black' : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{
                          background: newMedDosage === dos ? 'var(--accent)' : 'var(--bg2)',
                          color: newMedDosage === dos ? 'var(--accent-t, #ffffff)' : 'var(--text2)',
                          borderColor: newMedDosage === dos ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        {dos}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder={DOSAGE_PRESETS_BY_TYPE[newMedType].placeholder}
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-xs font-bold border outline-none font-en transition-all"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              {/* 4. Frequency & Times */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'var(--text)' }}>
                  ٤. دووبارەبوون و دەمژمێرێن خوارنێ:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { id: '1x', label: 'رۆژانە ١ جار', times: ['08:00'] },
                    { id: '2x', label: 'رۆژانە ٢ جاران', times: ['08:00', '20:00'] },
                    { id: '3x', label: 'هەر ٨ دەمژمێران', times: ['08:00', '16:00', '00:00'] },
                    { id: 'needed', label: 'ل دەمێ پێدڤی', times: ['12:00'] },
                  ].map(freq => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNewMedFrequency(freq.id as any);
                        setNewMedTimes(freq.times);
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        newMedFrequency === freq.id ? 'border-2 shadow-xs' : 'opacity-75'
                      }`}
                      style={{
                        background: newMedFrequency === freq.id ? 'color-mix(in srgb, var(--accent) 8%, var(--bg2))' : 'var(--bg2)',
                        borderColor: newMedFrequency === freq.id ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <div className="font-black text-xs" style={{ color: 'var(--text)' }}>{freq.label}</div>
                      <div className="text-[10px] font-en font-bold mt-0.5" style={{ color: 'var(--text3)' }}>{freq.times.join(' · ')}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {newMedTimes.map((t, idx) => (
                    <input
                      key={idx}
                      type="time"
                      value={t}
                      onChange={(e) => {
                        const updated = [...newMedTimes];
                        updated[idx] = e.target.value;
                        setNewMedTimes(updated);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border font-en text-center"
                      style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  ))}
                </div>
              </div>

              {/* 5. Food Relation */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'var(--text)' }}>
                  ٥. پەیوەندی ب خوارنێ ڤە:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'after', label: 'پشتی خوارنێ' },
                    { id: 'before', label: 'پێش خوارنێ' },
                    { id: 'with', label: 'دگەل خوارنێ' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNewMedFood(f.id as any);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newMedFood === f.id ? 'shadow-xs' : 'opacity-70'
                      }`}
                      style={{
                        background: newMedFood === f.id ? 'var(--accent)' : 'var(--bg2)',
                        color: newMedFood === f.id ? 'var(--accent-t, #ffffff)' : 'var(--text2)',
                        borderColor: newMedFood === f.id ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Medical Notes */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'var(--text)' }}>
                  ٦. تێبینیێن نۆژداری (ئیختیاری):
                </label>
                <textarea
                  rows={2}
                  placeholder="بۆ نموونە: ئاڤەکا زۆر پێڤە ڤەخۆ..."
                  value={newMedNotes}
                  onChange={(e) => setNewMedNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl text-xs font-bold border outline-none resize-none"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-black text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'var(--accent-t, #ffffff)' }}
                >
                  <Check size={16} strokeWidth={3} />
                  <span>پاشەکەڤتکرن د خشتەی دا ✓</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── iOS ACTION SHEET: CHOOSE PHOTO SOURCE ── */}
      {showSourcePicker && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowSourcePicker(false)}
          style={{ zIndex: 999999 }}
        >
          <div
            className="w-full max-w-sm mx-auto space-y-2 animate-in slide-in-from-bottom-8 duration-200"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Options group */}
            <div
              className="rounded-2xl border overflow-hidden shadow-2xl backdrop-blur-xl"
              style={{ background: 'color-mix(in srgb, var(--surface) 95%, transparent)', borderColor: 'var(--border)' }}
            >
              <div className="py-2.5 px-4 text-center border-b text-[11px] font-bold" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
                هەلبژارتنا ژێدەرێ وێنەی
              </div>

              {/* Camera Option */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setShowSourcePicker(false);
                  setTimeout(() => cameraInputRef.current?.click(), 150);
                }}
                className="w-full py-3.5 px-5 flex items-center justify-between border-b transition-all active:bg-black/5 dark:active:bg-white/5 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <Camera size={18} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black" style={{ color: 'var(--text)' }}>وێنەگرتن ب کامیرێ</div>
                    <div className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>Take Photo</div>
                  </div>
                </div>
                <ChevronLeft size={16} style={{ color: 'var(--text3)' }} />
              </button>

              {/* Gallery Option */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setShowSourcePicker(false);
                  setTimeout(() => galleryInputRef.current?.click(), 150);
                }}
                className="w-full py-3.5 px-5 flex items-center justify-between transition-all active:bg-black/5 dark:active:bg-white/5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
                    <ImageIcon size={18} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black" style={{ color: 'var(--text)' }}>هەلبژارتن ژ ئەلبوومێ</div>
                    <div className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>Choose from Gallery</div>
                  </div>
                </div>
                <ChevronLeft size={16} style={{ color: 'var(--text3)' }} />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowSourcePicker(false);
              }}
              className="w-full py-3.5 rounded-2xl font-black text-xs border text-center transition-all active:scale-98 cursor-pointer shadow-lg"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              پاشگەزبوون
            </button>
          </div>
        </div>
      )}

      {/* ── ASK FOR DETAILED MEDICAL EXPLANATION (Tafsir / Analysis Modal) ── */}
      {analysisPromptMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setAnalysisPromptMed(null)}
          style={{ zIndex: 999999 }}
        >
          <div
            className="w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3.5 flex items-center justify-center shadow-lg border"
              style={{
                background: 'color-mix(in srgb, var(--accent) 15%, var(--bg2))',
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
              }}
            >
              <Stethoscope size={28} />
            </div>

            <h3 className="text-base font-black mb-1.5" style={{ color: 'var(--text)' }}>
              تە ڕوونکرنا زێدە دڤێت ل سەر ڤی دەرمانی؟
            </h3>
            <p className="text-xs font-semibold mb-4 leading-relaxed" style={{ color: 'var(--text2)' }}>
              شیکاریا پزیشکی یا هویر، مفا، زیانێن لاوەکی و دەرمانێن هاوتا بۆ <span className="font-black font-en px-1.5 py-0.5 rounded-md border text-emerald-500" style={{ borderColor: 'var(--border)' }}>{analysisPromptMed}</span> ب شێوازەکێ زانستی ببینە.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  const medName = analysisPromptMed;
                  setAnalysisPromptMed(null);
                  if (medName) {
                    const found = meds.find(m => m.name.toLowerCase().trim() === medName.toLowerCase().trim());
                    if (found) {
                      handleOpenMedAnalysis(found);
                    } else {
                      handleOpenMedAnalysis({
                        id: 'temp_' + Date.now(),
                        name: medName,
                        dosage: '٥٠٠ ملغ',
                        type: 'pill',
                        times: ['08:00'],
                        timeSlots: ['morning'],
                        foodRelation: 'after',
                        color: '#0ea5e9',
                        startDate: Date.now(),
                        active: true,
                        takenHistory: {},
                      });
                    }
                  }
                }}
                className="w-full py-3.5 rounded-2xl font-black text-xs shadow-md transition-all active:scale-95 text-center cursor-pointer"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-t, #ffffff)',
                }}
              >
                بەلێ، شیکاریا پزیشکی ڤەکە
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setAnalysisPromptMed(null);
                }}
                className="w-full py-3 rounded-2xl font-bold text-xs border transition-all active:scale-95 cursor-pointer"
                style={{
                  background: 'var(--bg2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text3)',
                }}
              >
                پاشەکەڤتکرن بێی شیکاری
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEDICINE MEDICAL ANALYSIS BOTTOM SHEET (Instant Cached Info) ── */}
      {selectedMedForAnalysis && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedMedForAnalysis(null)}
          style={{ zIndex: 999999 }}
        >
          <div
            className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              maxHeight: '88dvh',
              minHeight: '55dvh',
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Grab handle */}
            <div className="w-12 h-1.5 rounded-full mx-auto my-3 shrink-0" style={{ background: 'var(--border2)' }} />

            {/* Sheet Header */}
            <div className="px-5 pb-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedMedForAnalysis(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all active:scale-90 cursor-pointer"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text3)' }}
              >
                <X size={15} />
              </button>

              <h2 className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Stethoscope size={16} className="text-emerald-500" />
                <span>شیکاریا پزیشکی یا دەرمانی</span>
              </h2>

              <div className="w-8"></div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              
              {/* Hero: Centered Round Medicine Profile Card */}
              <div
                className="p-5 rounded-3xl border text-center shadow-xs flex flex-col items-center justify-center space-y-3"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
              >
                {/* Circular Avatar */}
                <div
                  className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 shadow-md p-0.5"
                  style={{
                    borderColor: 'var(--accent)',
                    background: 'var(--surface)',
                  }}
                >
                  <img
                    src={selectedMedForAnalysis.image || (selectedMedForAnalysis.name ? getMedicationAutoImage(selectedMedForAnalysis.name, selectedMedForAnalysis.type || 'pill') : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60')}
                    alt={selectedMedForAnalysis.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="font-black text-base font-en" style={{ color: 'var(--text)' }}>
                    {selectedMedForAnalysis.name}
                  </h3>

                  {/* Kurdish Subtitle / Notes */}
                  {selectedMedForAnalysis.notes ? (
                    <p className="text-xs font-semibold leading-relaxed px-2" style={{ color: 'var(--text2)' }}>
                      {selectedMedForAnalysis.notes}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold px-2" style={{ color: 'var(--text3)' }}>
                      چاڤدێریا دەرمانێ تۆمارکری
                    </p>
                  )}
                </div>
              </div>

              {/* Analysis Content (Always instant and rich) */}
              {(() => {
                const key = (selectedMedForAnalysis.name || '').toLowerCase().trim();
                const data = medAnalysesCache[key] || getInstantMedicineAnalysis(selectedMedForAnalysis.name, selectedMedForAnalysis.type || 'pill', selectedMedForAnalysis.dosage);

                const cleanGpsText = (txt: string) => {
                  if (!txt) return '';
                  return txt
                    .replace(/سیستەمێ هەوارچوونا بلەز\s*\(GPS\)[^.]*(\.|$)/gi, '')
                    .replace(/سیستەمێ هەوارچوونا بلەز[^.]*(\.|$)/gi, '')
                    .replace(/\(GPS\)/gi, '')
                    .trim();
                };

                return (
                  <div className="space-y-4">
                    {/* 1. Description & Overview */}
                    {data.description && (
                      <div
                        className="p-4 rounded-3xl border space-y-1.5"
                        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
                      >
                        <div className="text-xs font-black flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                          <BookOpen size={14} />
                          <span>کورتیا پزیشکی و مفا:</span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
                          {cleanGpsText(data.description)}
                        </p>
                      </div>
                    )}

                    {/* 3. Medical Sections (Warnings, Usage, Side Effects) */}
                    {data.sections && data.sections.map((sec, sIdx) => {
                      const cleanedContent = cleanGpsText(sec.content);
                      if (!cleanedContent) return null;
                      return (
                        <div
                          key={sIdx}
                          className="p-4 rounded-3xl border space-y-1.5"
                          style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
                        >
                          <div className="text-xs font-black flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                            <Activity size={14} />
                            <span>{sec.title}:</span>
                          </div>
                          <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text2)' }}>
                            {cleanedContent}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MedicationTrackerPanel;

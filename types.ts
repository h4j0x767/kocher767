
export interface MedicalStat {
  label: string;
  value: string;
  subLabel?: string; // e.g. "Work Duration", "Age"
  icon: 'clock' | 'percent' | 'scale' | 'user' | 'zap';
  color: string;
}

export interface MedicalSection {
  title: string;
  content: string;
  icon: 'info' | 'alert' | 'check' | 'shield' | 'book' | 'pill' | 'activity';
  colorClass: string; // Tailwind class for bg/border
}

export interface ReferenceLink {
  name: string;
  url: string;
}

export interface TreatmentRecommendation {
  name: string; // Kurdish/Badini name
  englishName?: string; // Scientific/English name
  description: string; // What it is used for and how it works in Badini
  dosage?: string; // e.g. 500mg, 1 tablet
  imagePrompt?: string; // Prompt for generating a picture of the drug box/packaging
  reference?: string; // Medical consensus reference (what global doctors say)
  referenceUrl?: string; // Clickable URL to a trusted medical source (drugs.com, medlineplus.gov, etc.)
  kurdishMarketAlternative?: {
    brandName: string;
    englishName: string;
    priceGuide: string;
    availability: string;
    reason: string;
  } | string;
}

export interface MedicalData {
  type: 'medicine' | 'condition' | 'general'; // Distinguishes between drug, disease, or general health topic
  name: string; // e.g. "Paracetamol"
  englishSubtitle: string; // e.g. "Pain reliever"
  rating: number; // 0-5
  description: string; // Main summary
  stats: MedicalStat[];
  sections: MedicalSection[];
  references?: ReferenceLink[];
  imagePrompt?: string; // Detailed English prompt for image generation
  ratingReason?: string; // Factual explanation for the rating based on medical consensus
  treatments?: TreatmentRecommendation[]; // Suggested medications/treatments
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ABOUT = 'ABOUT'
}

export interface HistoryItem {
  query: string;
  timestamp: number;
  data: MedicalData;
  image?: string | null;
}


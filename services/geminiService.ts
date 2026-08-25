import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MedicalData } from "../types";

const apiKeysStr = import.meta.env.VITE_API_KEYS || import.meta.env.VITE_API_KEY || '';
const apiKeys = apiKeysStr.split(',').map((k: string) => k.trim()).filter((k: string) => k !== '');

let currentKeyIndex = 0;

const getNextAIInstance = () => {
  const key = apiKeys[currentKeyIndex % apiKeys.length];
  currentKeyIndex++;
  console.log(`Using API Key #${currentKeyIndex % apiKeys.length || apiKeys.length}`);
  return new GoogleGenAI({ apiKey: key });
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['medicine', 'condition', 'general'], description: "Is this a drug, a disease, or a general health topic?" },
    name: { type: Type.STRING, description: "Medicine name or Condition name in Kurdish/English" },
    englishSubtitle: { type: Type.STRING, description: "English scientific name and short category" },
    rating: { type: Type.NUMBER, description: "General safety/efficacy rating 1-5 based on medical consensus" },
    description: { type: Type.STRING, description: "Comprehensive, factual medical summary in Badini Kurdish" },
    stats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Exact label requested in prompt" },
          subLabel: { type: Type.STRING, description: "English context or extra info" },
          value: { type: Type.STRING, description: "The factual value in Badini" },
          icon: { type: Type.STRING, enum: ['clock', 'percent', 'scale', 'user', 'zap'] },
          color: { type: Type.STRING, description: "Tailwind color name e.g. red, blue, green" }
        }
      }
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Section title in Badini Kurdish" },
          content: { type: Type.STRING, description: "Factual content in Badini Kurdish" },
          icon: { type: Type.STRING, enum: ['info', 'alert', 'check', 'shield', 'book', 'pill', 'activity'] },
          colorClass: { type: Type.STRING, description: "Color theme e.g. orange, purple, blue, green" }
        }
      }
    },
    references: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING }
        }
      }
    },
    imagePrompt: {
      type: Type.STRING,
      description: "A highly descriptive English prompt (40-60 words) for AI image generation. Describe the medical appearance: if a drug, describe the packaging/pills; if a condition, describe the anatomical/microscopic appearance in a clean, professional medical style."
    },
    ratingReason: {
      type: Type.STRING,
      description: "Brief factual explanation in Badini Kurdish why this rating (1-5) was given based on international medical consensus (WHO/FDA)."
    },
    treatments: {
      type: Type.ARRAY,
      description: "List of 2-3 specific predicted treatments, medicines, or pills recommended for this medical condition/report. Must be medically accurate.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Kurdish/Badini common name of the drug or treatment, e.g., پاراتسیتامۆل" },
          englishName: { type: Type.STRING, description: "English scientific name of the medicine, e.g., Paracetamol" },
          description: { type: Type.STRING, description: "How this treatment/medicine helps resolve the condition, dosage outline, or clinical role, written in Badini Kurdish." },
          imagePrompt: { type: Type.STRING, description: "Descriptive English prompt (15-25 words) to generate a professional photo of this medicine's BOX or PACKAGING on a clean white clinical background. Focus on the box/blister pack/bottle exterior." },
          reference: { type: Type.STRING, description: "Factual medical source/consensus reference (e.g. 'WHO states this is the first-line treatment for...', 'According to Mayo Clinic...', 'FDA approved for...') written in Badini Kurdish." },
          referenceUrl: { type: Type.STRING, description: "A real, valid URL to a trusted medical reference page for this specific drug. Use one of: https://www.drugs.com/[drugname].html OR https://medlineplus.gov/druginfo/meds/[id].html OR https://www.webmd.com/drugs/2/drug-[id]/[name]-oral/details OR https://www.who.int/medicines/publications/pharmacopoeia/[name]. Always use the English name to build the URL. Must be a real existing page." },
          kurdishMarketAlternative: {
            type: Type.OBJECT,
            description: "Cheaper or more widely available equivalent medicine (same active ingredient) in Duhok/Kurdistan pharmacies.",
            properties: {
              brandName: { type: Type.STRING, description: "Brand or Generic name available in Kurdish/Badini (e.g. سایدۆل / پاراتسیتامۆل)" },
              englishName: { type: Type.STRING, description: "English name of alternative" },
              priceGuide: { type: Type.STRING, description: "Comparison of price in Badini (e.g., نزیکەی ٥٠٪ ئەرزانترە)" },
              availability: { type: Type.STRING, description: "Availability in local pharmacies in Badini (e.g., زۆر بەردەستە ل دەرمانخانەیێن دهۆکێ)" },
              reason: { type: Type.STRING, description: "Reason why this alternative is recommended in Kurdistan in Badini Kurdish" }
            },
            required: ["brandName", "englishName", "priceGuide", "availability", "reason"]
          }
        },
        required: ["name", "englishName", "description", "imagePrompt", "reference", "referenceUrl", "kurdishMarketAlternative"]
      }
    }
  },
  required: ["type", "name", "englishSubtitle", "rating", "description", "stats", "sections", "references", "imagePrompt", "ratingReason", "treatments"]
};

export const analyzeMedicalQuery = async (query: string, imageBase64?: string): Promise<MedicalData> => {
  // Map gemini-3.5-flash to gemini-2.5-flash to ensure compatibility with Google API (gemini-3.5-flash is not registered yet)
  const modelId = "gemini-3.5-flash";
  const maxRetries = apiKeys.length;
  let lastError: any = null;

  // Small helper for delay between retries
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const isImage = !!imageBase64;
    let wearablePromptText = "";
    try {
      const savedWearable = localStorage.getItem('__dr_badini_wearable_data__');
      if (savedWearable) {
        const wData = JSON.parse(savedWearable);
        wearablePromptText = `
          **PATIENT BIOMETRICS (FROM SMARTWATCH SYNC)**:
          - Daily Steps: ${wData.steps}
          - Resting Heart Rate: ${wData.heartRate} bpm
          - Sleep Quality: ${wData.sleep}%
          - Blood Oxygen (SpO2): ${wData.oxygen}%
          Please analyze these real-time smartwatch stats in correlation with the symptoms or report. Provide specific remarks on whether they indicate active health, cardiac strain, or sleep deprivation, and tailor your lifestyle/diet recommendations to support these metrics.
        `;
      }
    } catch (e) {
      console.warn("Failed to parse wearable data", e);
    }

    const promptText = isImage ? `
      **MISSION**: You are an elite Senior Clinical AI Doctor and Laboratory Specialist. Your goal is to provide an EXTREMELY DETAILED, LONG, and professional medical analysis in Badini Kurdish (Duhok/Zakho dialect).
      
      **CORE RULE**: You MUST extract EVERY SINGLE VALUE from the provided medical report. Do not skip any data. Each of the 12 sections below must be VERY LONG (at least 3-4 paragraphs each if possible) and provide deep medical insight.


      
      **MANDATORY 12 SECTIONS (EXHAUSTIVE & LONG)**:
      1. "ئەف تاقیکرنە ل سەر چ تشتە؟" - Provide a comprehensive scientific breakdown. Explain exactly what the test measures, why it is medically significant, which organs (liver, kidney, blood) it targets, and the biological processes involved.
      2. "ئەنجامێن باش" - List EVERY normal value found. You MUST list them VERTICALLY (one per line) in this format: Value : (Reference Range : ڕێژا ئاسایی) Test Name (Abbreviation).
      3. "ئەنجامێن خراب" - Identify all High/Low/Abnormal results. You MUST list them VERTICALLY (one per line). Explain in great depth WHY these are abnormal, the potential clinical implications, and why this happens biologically.
      4. "ئەنجامێن نێزیک بلند/خواری ژ نۆرمال" - Identify values that are technically in range but borderline. Provide proactive warnings and preventative insights.
      5. "ئەگەرێن ڤان ئەنجامێن نەیێ ئاسایی" - Analyze all possible causes: genetics, current illness, medication side effects, or lifestyle habits (smoking, lack of water, diet).
      6. "نیشانێن پێتڤیە تو هایداری بی" - Based on the results, describe specific symptoms the patient might be experiencing now or in the future (e.g., fatigue, dizziness, pain).
      7. "خوارنێن باش بۆ باشترکرنێ" - Provide a massive list (8-10 items) of superfoods, minerals, and vitamins that specifically counter the abnormalities found. Explain the role of each food.
      8. "خوارنێن خراب - خۆ ژێ دوویر بکە" - List foods, drinks, and habits to eliminate immediately. Explain the negative impact of each on these specific lab results.
      9. "گۆهۆرینێن ژیانێ" - Create a full lifestyle rebuilding plan. Include specific sleep schedules, workout intensities, stress-reduction techniques, and hydration goals.
      10. "کێمکرنا مەترسیان" - Describe long-term strategies to avoid chronic diseases related to these findings (e.g., preventing diabetes or heart issues).
      11. "کەی پێتڤیە جارەکا دی پشکنینێ بکەی؟" - Provide a clear medical timeline for follow-up (e.g., in 3 months) and explain why monitoring is crucial.
      12. "ئامۆژگاریا دووماهیێ و سەردانا نوژداری" - A powerful, professional closing summary. Stress the importance of seeing a human doctor for a physical exam and final diagnosis.

      **Structure**:
      - **type**: 'condition'.
      - **name**: "ئەنجامێ شیکاریێ نوژداری یێ کوویر"
      - **stats**: Exactly 8 key summary metrics derived from the report.
      - **sections**: EXACTLY 12 sections. Each section MUST be long and rich in detail.
      - **references**: 3-4 professional medical reference links (WHO, Mayo Clinic, CDC).
      - **treatments**: 2-3 specific predicted treatments/medicines/pills for this condition, with image prompts of the MEDICINE BOX/PACKAGING and a real referenceUrl link (drugs.com, medlineplus, webmd) per treatment. Each treatment MUST include a kurdishMarketAlternative representing a cheaper or more widely available generic drug in Kurdistan (Turkish, Iraqi, or Jordanian brands containing the same active ingredient).

      **FORMATTING**: Plain text only. No markdown symbols (*, #, -). Use clinical Badini language: "دکەت", "ناڤا", "پشکنین", "چێدبیت".
      **IMPORTANT**: NEVER use first-person pronouns like "ئەز" (I) or "دبێژم" (I say). Speak as an objective global medical diagnostic system. All explanations must be institutional and professional.
    ` : `
      **MISSION**: You are a Senior Medical Consultant AI. Answer the following health query in Badini Kurdish (Duhok/Zakho dialect).
      
      **CORE RULE**: Provide accurate, scientific, and helpful medical advice. NEVER use first-person pronouns like "ئەز" (I). Speak as an official medical source. Be professional and encouraging.

      **QUERY**: ${query}

      **Structure (JSON)**:
      - **type**: Choose 'medicine', 'condition', or 'general' based on the topic.
      - **name**: Topic name in Badini.
      - **englishSubtitle**: Scientific English name.
      - **description**: Detailed overview.
      - **sections**: At least 4-6 detailed sections covering Overview, Symptoms, Causes, Treatment, Diet, and Lifestyle.
      - **stats**: Exactly 8 relevant health stats or metrics.
      - **treatments**: 2-3 specific predicted treatments/medicines/pills for this condition/query, with image prompts of the MEDICINE BOX/PACKAGING and a real referenceUrl link (drugs.com, medlineplus, webmd) per treatment. Each treatment MUST include a kurdishMarketAlternative representing a cheaper or more widely available generic drug in Kurdistan (Turkish, Iraqi, or Jordanian brands containing the same active ingredient).
      
      **FORMATTING**: Plain text only. Use clinical Badini language: "دکەت", "ناڤا", "پشکنین".
      **IMPORTANT**: Do not use "ئەز" (I). Use professional clinical structures.
    `;

    // Prepare contents array
    const parts: any[] = [{ text: promptText }];
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
    }

    try {
      const ai = getNextAIInstance();
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const data = JSON.parse(text);

      const cleanGps = (str: string) => {
        if (!str) return str;
        return str.replace(/سیستەمێ هەوارچوونا بلەز\s*\(GPS\)[^.]*(\.|$)/gi, '').replace(/\(GPS\)/gi, '').trim();
      };

      return {
        type: data.type || 'condition',
        name: data.name || 'Undefined',
        englishSubtitle: data.englishSubtitle || '',
        rating: data.rating || 0,
        description: cleanGps(data.description || ''),
        stats: Array.isArray(data.stats) ? data.stats : [],
        sections: Array.isArray(data.sections) ? data.sections.map((s: any) => ({ ...s, content: cleanGps(s.content || '') })) : [],
        references: Array.isArray(data.references) ? data.references : [],
        imagePrompt: data.imagePrompt || '',
        ratingReason: data.ratingReason || '',
        treatments: Array.isArray(data.treatments) ? data.treatments : []
      } as MedicalData;

    } catch (error: any) {
      lastError = error;
      // If rate limited (429) or overloaded (503), try the next key with a small delay
      if (error.message?.includes('429') || error.message?.includes('503') || error.status === 429 || error.status === 503) {
        console.warn(`Key rate limited or overloaded. Retrying with next key in 1s...`);
        await sleep(1000); // 1 second delay
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

export const identifyMedicationFromImage = async (base64Image: string): Promise<{
  name: string;
  dosage?: string;
  type?: 'pill' | 'syrup' | 'injection' | 'drops' | 'cream' | 'inhaler';
  notes?: string;
} | null> => {
  try {
    const ai = getNextAIInstance();
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg',
              }
            },
            {
              text: `You are an expert pharmacist and OCR scanner for medications. Look at this medication package, box, blister, bottle, syrup, tube, or prescription image.
Extract:
1. The exact Commercial/Trade Brand Name of the medication (e.g. Panadol, Amoxicillin, Augmentin, Brufen, Omeprazole, etc.)
2. The dosage/strength if visible (e.g. 500mg, 1000mg, 125mg/5ml, etc.)
3. The type of medication: one of ["pill", "syrup", "injection", "drops", "cream", "inhaler"]
4. A short description or use in Badini Kurdish (e.g. بۆ ژانەسەرێ و ئێشێ)

Return pure JSON only in this exact format:
{
  "name": "Panadol Extra",
  "dosage": "500 mg",
  "type": "pill",
  "notes": "بۆ ژانەسەرێ و تاێ"
}`
            }
          ]
        }
      ]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
  } catch (err) {
    console.error('Failed to identify medication from image:', err);
  }
  return null;
};

export interface SkinVisionResult {
  conditionName: string;
  englishName: string;
  severity: 'mild' | 'moderate' | 'severe';
  severityLabel: string;
  confidence: number;
  description: string;
  spatial3dNotes?: string;
  homeCare: string[];
  recommendedOintments: {
    name: string;
    englishName: string;
    usage: string;
    notes?: string;
  }[];
  warningAdvice: string;
  whenToSeeDoctor: string;
  scannedFrames?: string[];
}

export const analyzeSkinVision = async (images: string | string[]): Promise<SkinVisionResult | null> => {
  try {
    const ai = getNextAIInstance();
    const imageList = Array.isArray(images) ? images : [images];

    const parts: any[] = [];
    imageList.forEach((img) => {
      const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg',
        }
      });
    });

    const isMultiAngle = imageList.length > 1;

    parts.push({
      text: `You are an elite Board-Certified Dermatologist and Spatial 3D Skin Vision AI Specialist. Analyze these ${isMultiAngle ? `${imageList.length} multi-angle 3D video scan frames (captured by moving the camera all around the lesion/head/skin)` : 'skin lesion'} photos in Badini Kurdish (Duhok/Zakho dialect).

Provide accurate clinical guidance based on ${isMultiAngle ? 'multi-angle skin depth, border symmetry, texture, and surrounding redness' : 'the visual appearance'}:
1. Condition Name in Badini and English.
2. Severity: "mild" (کێم), "moderate" (ناڤین), or "severe" (بلند / پێدڤی ب نۆژداری).
3. Estimated Confidence percentage (e.g. 96).
4. Description in friendly, professional Badini Kurdish.
5. Spatial 3D / Depth Analysis in Badini: Note whether the wound/rash is superficial on outer epidermis or deep, border clarity, and color texture across angles.
6. Home Care: 3-4 bullet points of immediate safe steps.
7. Recommended Ointments & Creams available in Iraqi Kurdistan pharmacies (e.g. Hydrocortisone, Bepanthen, Fucidin, Panthenol, Clotrimazole, etc.) with usage instructions in Badini.
8. Crucial Warning advice and when to urgently consult a medical doctor.

Return ONLY pure JSON in this structure:
{
  "conditionName": "ئەکزیما یان حەساسیەتا پێستی",
  "englishName": "Contact Dermatitis / Eczema",
  "severity": "mild",
  "severityLabel": "کێم و دەستپێکی",
  "confidence": 96,
  "description": "پێست تووشی سووربوون و خوریانەکا سادە بوویە ژ ئەگەرا بەرکەفتنێ دگەل تشتەکێ هەستیارکەر.",
  "spatial3dNotes": "شیکاریا هەمی ڕەخان دیار دکەت کو برین ل سەر چینا دەرڤە یا پێستی یە و هێشتا نەگەهشتیە شانەیێن کویر.",
  "homeCare": [
    "جهێ برینێ ب ئاڤا شلەتێن و سابوونەکا بێ بێهن پاقژ بکە",
    "خۆ ژ خاراندنێ و بکارئینانا ئاڤا زۆر گەرم بپارێزە",
    "کۆمپڕێسەکا فێنک دانە سەر جهێ سۆتنێ بۆ هێورکرنێ"
  ],
  "recommendedOintments": [
    {
      "name": "مەرهەمێ بیپانتین پلەس (Bepanthen Plus)",
      "englishName": "Bepanthen Plus Cream",
      "usage": "ڕۆژانە ٢ جاران چینەکا تەنک ل سەر بهێتە دانان",
      "notes": "بۆ شێدارکرن و ساڕێژکرنا برینێن سادە"
    },
    {
      "name": "کرێما هایدرۆکۆرتیزۆن ١٪ (Hydrocortisone 1%)",
      "englishName": "Hydrocortisone Cream",
      "usage": "شەڤێ جارەکێ پێش خەوێ",
      "notes": "بۆ کێمکرنا خوریان و سووربوونێ"
    }
  ],
  "warningAdvice": "نەهێتە بەرکەفتن دگەل ناڤا چاڤان و ل سەر برینێن کویر نەهێتە دانان.",
  "whenToSeeDoctor": "ئەگەر پشتی ٣ ڕۆژان خوریان و سووربوون زێدە بوو یان ئاڤ ژێ هات، پێدڤیە سەرەدانا نۆژدارێ پێستی بکەی."
}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: parts }]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.scannedFrames = imageList;
      return parsed;
    }
  } catch (err) {
    console.error('Failed to analyze multi-angle skin vision:', err);
  }
  return null;
};
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, RefreshCw, Zap, ZapOff, AlertCircle, 
  Plus, ShieldCheck, HeartPulse, Stethoscope,
  Image as ImageIcon, Loader2, ScanLine, Layers, CheckCircle2, ChevronLeft, ArrowRight
} from 'lucide-react';
import { analyzeSkinVision, SkinVisionResult } from '../services/geminiService';
import { MedicationItem } from './MedicationTrackerPanel';

interface SkinVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  showToast?: (title: string, message: string, type?: 'success' | 'alert' | 'info' | 'ai') => void;
  onAddMedicationFromOintment?: (med: { name: string; dosage: string; type: MedicationItem['type']; notes: string }) => void;
}

const FACE_ID_STEPS = [
  {
    step: 1,
    title: 'ناڤەڕاست و ڕووبەڕوو',
    prompt: 'سەرێ خۆ ب ڕێکی ل ناڤەڕاستێ ڕاگرە',
    hint: 'جهێ برینێ یان ڕووی ل ناڤ بازنێ دیار بکە',
    iconName: 'center',
  },
  {
    step: 2,
    title: 'لایێ چەپێ',
    prompt: 'سەرێ خۆ کەمەکێ لایێ چەپێ بچەمینە ⬅️',
    hint: 'لایێ چەپێ یێ پێستی یان برینێ پیشان بدە',
    iconName: 'left',
  },
  {
    step: 3,
    title: 'لایێ ڕاستێ',
    prompt: 'نوکە سەرێ خۆ لایێ ڕاستێ بچەمینە ➡️',
    hint: 'لایێ ڕاستێ یێ برینێ پیشان بدە',
    iconName: 'right',
  },
  {
    step: 4,
    title: 'نێزیکبوون و کویری',
    prompt: 'کەمەکێ نێزیکتر بگرە بۆ شیکاریا کویر 🔍',
    hint: 'کامیرێ نێزیکتر بکە بۆ دیتنا هویرکاریێن پێستی',
    iconName: 'close',
  },
];

export const SkinVisionModal: React.FC<SkinVisionModalProps> = ({
  isOpen,
  onClose,
  darkMode = false,
  showToast,
  onAddMedicationFromOintment,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Apple Face ID Step-by-Step State
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0, 1, 2, 3
  const [stepFrames, setStepFrames] = useState<string[]>([]);
  const [stepHoldProgress, setStepHoldProgress] = useState(0); // 0 to 100
  const [isCapturingStep, setIsCapturingStep] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkinVisionResult | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<any>(null);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'medium') navigator.vibrate(35);
      else navigator.vibrate([40, 60, 40]);
    }
  };

  // Start / Stop Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetAllStates();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isOpen, facingMode]);

  const resetAllStates = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setCurrentStepIndex(0);
    setStepFrames([]);
    setStepHoldProgress(0);
    setIsCapturingStep(false);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('کامیرە ل سەر ڤی وێبگەڕی بەردەست نینە');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for flashlight capability
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setHasTorch(!!capabilities.torch);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('نەشیام کامیرێ ڤەکەم. تکایە دەستووریێ بدە یان وێنەیەک ژ گەلەریێ هەڵبژێرە.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
        triggerHaptic('light');
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  const toggleCameraFacing = () => {
    triggerHaptic('medium');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Grab a single snapshot frame helper
  const grabCurrentFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // ── CONFIRM / COMPLETE CURRENT FACE ID STEP ──
  const confirmCurrentStep = () => {
    if (isCapturingStep || !videoRef.current) return;
    triggerHaptic('heavy');
    setIsCapturingStep(true);

    const frame = grabCurrentFrame();
    if (!frame) {
      setIsCapturingStep(false);
      return;
    }

    const nextFrames = [...stepFrames, frame];
    setStepFrames(nextFrames);

    if (currentStepIndex < 3) {
      // Advance to next guided step
      setCurrentStepIndex((prev) => prev + 1);
      setIsCapturingStep(false);
      triggerHaptic('medium');
    } else {
      // Completed all 4 steps!
      triggerHaptic('heavy');
      setIsCapturingStep(false);
      setCapturedImage(nextFrames[0]);
      stopCamera();
      performSkinAnalysis(nextFrames);
    }
  };

  // Upload photo from gallery fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('medium');
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      stopCamera();
      setCapturedImage(base64);
      setStepFrames([base64]);
      performSkinAnalysis([base64]);
    };
    reader.readAsDataURL(file);
  };

  const performSkinAnalysis = async (images: string[]) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    if (showToast) {
      showToast('شیکاریا هەمی ڕەخان', 'شیکاریا شانە و نیشانێن برینێ دهێتە ئەنجامدان...', 'info');
    }

    try {
      const result = await analyzeSkinVision(images);
      if (result) {
        setAnalysisResult(result);
        triggerHaptic('medium');
        if (showToast) {
          showToast('پشکنین تەواو بوو', result.conditionName, 'success');
        }
      } else {
        throw new Error('نەشیام شیکاریا وێنەی بکەم');
      }
    } catch (err) {
      console.error('Skin vision analysis error:', err);
      if (showToast) {
        showToast('کێشەیەک چێبوو', 'نەشیام وێنەی ب دروستی بخوینم. تکایە دووبارە تاقی بکە.', 'alert');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAndRetake = () => {
    triggerHaptic('light');
    resetAllStates();
    startCamera();
  };

  const handleAddOintmentToMeds = (ointment: { name: string; englishName: string; usage: string; notes?: string }) => {
    triggerHaptic('medium');

    if (onAddMedicationFromOintment) {
      onAddMedicationFromOintment({
        name: ointment.englishName || ointment.name,
        dosage: 'چینەکا تەنک',
        type: 'cream',
        notes: ointment.usage || ointment.notes || 'بۆ ساڕێژکرن و چارەسەریا پێستی',
      });
      if (showToast) {
        showToast('زێدەکرن بۆ دەرمانان', `مەرهەمێ ${ointment.name} ل خشتەیێ دەرمانان هاتە تۆمارکرن ✓`, 'success');
      }
    }
  };

  const activeStepObj = FACE_ID_STEPS[currentStepIndex] || FACE_ID_STEPS[0];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
      style={{ zIndex: 999999 }}
      dir="rtl"
    >
      <div className="relative w-full h-full max-w-lg md:max-h-[92dvh] md:rounded-[2.5rem] overflow-hidden flex flex-col bg-black shadow-2xl">
        
        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ── TOP HEADER CONTROLS ── */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 pt-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-lg"
          >
            <X size={18} />
          </button>

          {/* Apple Face ID 4-Step Progress Indicator */}
          {!capturedImage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-lg">
              {FACE_ID_STEPS.map((s, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={s.step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'w-6 bg-emerald-400'
                        : isCurrent
                        ? 'w-8 bg-white shadow-[0_0_8px_#ffffff]'
                        : 'w-3 bg-white/25'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Flashlight button (if supported) */}
          {hasTorch && !capturedImage ? (
            <button
              type="button"
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-lg ${
                isTorchOn ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-amber-400/40' : 'bg-black/50 backdrop-blur-md border-white/20 text-white'
              }`}
            >
              {isTorchOn ? <Zap size={18} fill="currentColor" /> : <ZapOff size={18} />}
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>

        {/* ── CAMERA / CAPTURE VIEWPORT ── */}
        <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
          
          {capturedImage ? (
            // Captured photos preview (Multi-angle gallery)
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
              <img
                src={stepFrames[activeFrameIndex] || capturedImage}
                alt="Captured Skin"
                className="w-full h-full object-contain"
              />
              
              {/* Dynamic Scanning Laser Animation during Analysis */}
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                  {/* Laser line moving vertically */}
                  <div className="absolute inset-x-8 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-bounce" />
                  
                  {/* Status Box */}
                  <div className="p-5 rounded-3xl bg-black/85 backdrop-blur-md border border-emerald-500/40 text-center space-y-3 shadow-2xl max-w-xs mx-4">
                    <Loader2 size={36} className="animate-spin text-emerald-400 mx-auto" />
                    <div className="text-sm font-black text-white">شیکاریا ٤ ڕەخێن پێستی د دەستپێکێ دایە...</div>
                    
                    {/* Multi-angle mini thumbnails preview */}
                    {stepFrames.length > 1 && (
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        {stepFrames.map((f, i) => (
                          <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-400/50 shadow-inner">
                            <img src={f} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-300 font-semibold leading-relaxed pt-1">
                      شیکاریا کویریێ و دەستنیشانکرنا چارەسەریێ ب زمانێ بادینی.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Live Camera View with Apple Face ID Circular Enrollment
            <>
              {cameraError ? (
                <div className="p-6 text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-xs font-bold text-slate-300 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-lg active:scale-95 transition-transform cursor-pointer"
                  >
                    هەڵبژارتنا وێنەی ژ گەلەریێ
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* ── Apple Face ID Circular Reticle Overlay ── */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                    <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center">
                      
                      {/* Outer Ring with 4 Guided Quadrants */}
                      <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                      
                      {/* Face ID Animated Quadrant Ticks */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        {/* Circle circumference is ~2 * PI * 135 ≈ 848 */}
                        <circle
                          cx="50%"
                          cy="50%"
                          r="46%"
                          fill="none"
                          stroke={currentStepIndex >= 0 ? '#10b981' : 'rgba(255,255,255,0.2)'}
                          strokeWidth="6"
                          strokeDasharray="212 636"
                          strokeDashoffset={0}
                          className={`transition-all duration-500 ${currentStepIndex >= 1 ? 'opacity-100' : 'opacity-40 animate-pulse'}`}
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="46%"
                          fill="none"
                          stroke={currentStepIndex >= 1 ? '#10b981' : 'rgba(255,255,255,0.2)'}
                          strokeWidth="6"
                          strokeDasharray="212 636"
                          strokeDashoffset={-212}
                          className={`transition-all duration-500 ${currentStepIndex >= 2 ? 'opacity-100' : currentStepIndex === 1 ? 'opacity-90 animate-pulse' : 'opacity-20'}`}
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="46%"
                          fill="none"
                          stroke={currentStepIndex >= 2 ? '#10b981' : 'rgba(255,255,255,0.2)'}
                          strokeWidth="6"
                          strokeDasharray="212 636"
                          strokeDashoffset={-424}
                          className={`transition-all duration-500 ${currentStepIndex >= 3 ? 'opacity-100' : currentStepIndex === 2 ? 'opacity-90 animate-pulse' : 'opacity-20'}`}
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="46%"
                          fill="none"
                          stroke={currentStepIndex >= 3 ? '#10b981' : 'rgba(255,255,255,0.2)'}
                          strokeWidth="6"
                          strokeDasharray="212 636"
                          strokeDashoffset={-636}
                          className={`transition-all duration-500 ${currentStepIndex === 3 ? 'opacity-90 animate-pulse' : 'opacity-20'}`}
                        />
                      </svg>

                      {/* Directional Angle Guides */}
                      <div className="absolute top-2 w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-[10px] font-black text-white">
                        {currentStepIndex >= 1 ? '✓' : '١'}
                      </div>
                      <div className="absolute right-2 w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-[10px] font-black text-white">
                        {currentStepIndex >= 2 ? '✓' : '٢'}
                      </div>
                      <div className="absolute left-2 w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-[10px] font-black text-white">
                        {currentStepIndex >= 3 ? '✓' : '٣'}
                      </div>
                      <div className="absolute bottom-2 w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-[10px] font-black text-white">
                        {currentStepIndex >= 4 ? '✓' : '٤'}
                      </div>

                      {/* Center Crosshair Target */}
                      <div className="w-12 h-12 rounded-full border border-emerald-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                    </div>
                  </div>

                  {/* ── Apple Guided Step Instructions Pill ── */}
                  <div className="absolute top-20 inset-x-0 flex justify-center pointer-events-none px-4 z-20">
                    <div className="px-5 py-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-center shadow-2xl space-y-0.5 max-w-sm">
                      <div className="text-[10px] font-black text-emerald-400">
                        پێنگاڤا {activeStepObj.step} ژ ٤: {activeStepObj.title}
                      </div>
                      <div className="text-sm font-black text-white">
                        {activeStepObj.prompt}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>

        {/* ── BOTTOM CONTROLS: Apple Face ID Capture Button ── */}
        {!analysisResult && (
          <div className="p-6 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col items-center gap-4 z-30">
            
            {capturedImage ? (
              <button
                type="button"
                onClick={resetAndRetake}
                className="px-6 py-3.5 rounded-full bg-white/15 border border-white/25 text-white font-black text-xs flex items-center gap-2 active:scale-95 transition-transform cursor-pointer shadow-lg"
              >
                <RefreshCw size={15} />
                <span>دووبارە دەستپێکرن</span>
              </button>
            ) : (
              <div className="w-full flex items-center justify-between gap-4 px-2">
                
                {/* Gallery Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    triggerHaptic('light');
                    fileInputRef.current?.click();
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-lg shrink-0"
                  title="وێنە ژ گەلەریێ"
                >
                  <ImageIcon size={20} />
                </button>

                {/* Main Face ID Confirm Step Button */}
                <button
                  type="button"
                  onClick={confirmCurrentStep}
                  className="flex-1 py-4 px-5 rounded-full bg-emerald-500 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-2xl flex items-center justify-center gap-2 border border-emerald-400/40"
                >
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>
                    {currentStepIndex === 0
                      ? 'تۆمارکرنا ناڤەڕاستێ (١/٤)'
                      : currentStepIndex === 1
                      ? 'تۆمارکرنا لایێ چەپێ (٢/٤)'
                      : currentStepIndex === 2
                      ? 'تۆمارکرنا لایێ ڕاستێ (٣/٤)'
                      : 'تەواوکرنا پشکنینێ (٤/٤)'}
                  </span>
                </button>

                {/* Flip Camera Button */}
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={toggleCameraFacing}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-lg shrink-0"
                  title="گۆهۆڕینا کامیرێ"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSIS RESULT SHEET (iOS Bottom Sheet Overlay) ── */}
        {analysisResult && (
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[2.5rem] border-t border-x overflow-y-auto flex flex-col z-40 animate-in slide-in-from-bottom duration-300 shadow-2xl"
            style={{
              background: 'var(--surface, #1e293b)',
              borderColor: 'var(--border, rgba(255,255,255,0.15))',
              color: 'var(--text, #ffffff)',
            }}
          >
            {/* Grab handle */}
            <div className="w-12 h-1.5 rounded-full mx-auto my-3 shrink-0" style={{ background: 'var(--border2, #475569)' }} />

            {/* Sheet Header */}
            <div className="px-5 pb-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))' }}>
              <button
                type="button"
                onClick={resetAndRetake}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-90 flex items-center gap-1.5 cursor-pointer"
                style={{ background: 'var(--bg2, #334155)', borderColor: 'var(--border, rgba(255,255,255,0.1))', color: 'var(--text, #ffffff)' }}
              >
                <Camera size={13} />
                <span>پشکنینەکا نوێ</span>
              </button>

              <div className="text-xs font-black flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={16} />
                <span>ئەنجامێ شیکاریا ٤ ڕەخان</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 overflow-y-auto pb-10">
              
              {/* Multi-Angle Scanned Frames Horizontal Gallery */}
              {analysisResult.scannedFrames && analysisResult.scannedFrames.length > 1 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-black flex items-center gap-1 text-slate-400">
                    <Layers size={12} className="text-emerald-400" />
                    <span>گۆشە و ڕەخێن هاتیە پشکنین ({analysisResult.scannedFrames.length} ڕەخ):</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {analysisResult.scannedFrames.map((frame, fIdx) => {
                      const labels = ['ناڤەڕاست', 'لایێ چەپێ', 'لایێ ڕاستێ', 'نێزیکبوون'];
                      return (
                        <div
                          key={fIdx}
                          onClick={() => {
                            triggerHaptic('light');
                            setActiveFrameIndex(fIdx);
                          }}
                          className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 relative cursor-pointer transition-all ${
                            activeFrameIndex === fIdx ? 'border-emerald-400 scale-105 shadow-md' : 'border-white/10 opacity-70'
                          }`}
                        >
                          <img src={frame} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-bold text-center text-white py-0.5 truncate">
                            {labels[fIdx] || `گۆشە ${fIdx + 1}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hero Diagnosis Card */}
              <div
                className="p-4 rounded-3xl border space-y-2.5 shadow-xs"
                style={{ background: 'var(--bg2, #0f172a)', borderColor: 'var(--border, rgba(255,255,255,0.1))' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base" style={{ color: 'var(--text, #ffffff)' }}>
                      {analysisResult.conditionName}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 font-en">
                      {analysisResult.englishName}
                    </p>
                  </div>

                  {/* Severity Badge */}
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${
                      analysisResult.severity === 'mild'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : analysisResult.severity === 'moderate'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{analysisResult.severityLabel}</span>
                  </div>
                </div>

                <p className="text-xs font-semibold leading-relaxed pt-1" style={{ color: 'var(--text2, #cbd5e1)' }}>
                  {analysisResult.description}
                </p>

                {/* Spatial 3D Findings */}
                {analysisResult.spatial3dNotes && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 leading-relaxed">
                    <span className="font-black">شیکاریا کویریێ: </span>
                    {analysisResult.spatial3dNotes}
                  </div>
                )}

                {/* Confidence Bar */}
                <div className="pt-2 border-t flex items-center justify-between text-[11px] font-bold" style={{ borderColor: 'var(--border, rgba(255,255,255,0.08))', color: 'var(--text3, #94a3b8)' }}>
                  <span>ڕێژەیا باوەریا پشکنینێ:</span>
                  <span className="font-black text-emerald-400 font-en">{analysisResult.confidence}% Confidence</span>
                </div>
              </div>

              {/* Home Care First Aid */}
              {analysisResult.homeCare && analysisResult.homeCare.length > 0 && (
                <div
                  className="p-4 rounded-3xl border space-y-2"
                  style={{ background: 'var(--bg2, #0f172a)', borderColor: 'var(--border, rgba(255,255,255,0.1))' }}
                >
                  <div className="text-xs font-black flex items-center gap-1.5 text-emerald-400">
                    <HeartPulse size={14} />
                    <span>چارەسەریا سەرەتایی و ڕێنمایی ل مال:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs font-semibold" style={{ color: 'var(--text, #ffffff)' }}>
                    {analysisResult.homeCare.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Ointments & Creams */}
              {analysisResult.recommendedOintments && analysisResult.recommendedOintments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black flex items-center gap-1.5 px-1" style={{ color: 'var(--text, #ffffff)' }}>
                    <Stethoscope size={14} className="text-emerald-400" />
                    <span>مەرهەم و کرێمێن پێشنیارکری ل دەرمانخانێن کوردستانێ:</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {analysisResult.recommendedOintments.map((oint, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border space-y-2"
                        style={{ background: 'var(--bg2, #0f172a)', borderColor: 'var(--border, rgba(255,255,255,0.1))' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-black" style={{ color: 'var(--text, #ffffff)' }}>
                              {oint.name}
                            </h4>
                            <p className="text-[11px] font-bold text-slate-400 font-en">
                              {oint.englishName}
                            </p>
                          </div>

                          {/* 1-Tap Add to Medication Tracker */}
                          {onAddMedicationFromOintment && (
                            <button
                              type="button"
                              onClick={() => handleAddOintmentToMeds(oint)}
                              className="px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer"
                              style={{
                                background: 'color-mix(in srgb, var(--accent, #10b981) 15%, var(--bg2, #334155))',
                                borderColor: 'var(--accent, #10b981)',
                                color: 'var(--accent, #10b981)',
                              }}
                            >
                              <Plus size={11} strokeWidth={3} />
                              <span>زێدەکرن بۆ دەرمانان</span>
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] font-semibold" style={{ color: 'var(--text2, #cbd5e1)' }}>
                          {oint.usage}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning & When to See Doctor */}
              {analysisResult.whenToSeeDoctor && (
                <div
                  className="p-4 rounded-3xl border space-y-1.5"
                  style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                >
                  <div className="text-xs font-black flex items-center gap-1.5 text-red-400">
                    <AlertCircle size={14} />
                    <span>کەنگی پێدڤیە سەرەدانا نۆژداری بکەی؟</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-slate-200">
                    {analysisResult.whenToSeeDoctor}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SkinVisionModal;

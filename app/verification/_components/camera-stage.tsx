'use client';

import { motion } from 'framer-motion';
import { Camera, CameraOff, Upload, Sparkles, RotateCcw, XCircle, Loader2 } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { scaleIn } from './animations';

interface CameraStageProps {
  cameraActive: boolean;
  cameraError: boolean;
  capturedPhoto: string | null;
  isAiAnalyzing: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapturePhoto: () => void;
  onRetakePhoto: () => void;
  onSubmitAI: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CameraStage({
  cameraActive, cameraError, capturedPhoto, isAiAnalyzing,
  videoRef, canvasRef, fileInputRef,
  onStartCamera, onStopCamera, onCapturePhoto, onRetakePhoto, onSubmitAI, onFileUpload,
}: CameraStageProps) {
  return (
    <motion.div key="camera-stage" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={scaleIn} className="mb-16">
      <motion.h2 variants={scaleIn} className="text-2xl md:text-3xl font-black text-center mb-10">
        التقاط <span className="text-sovereign-gold">الصورة</span>
      </motion.h2>
      <GlassPanel className="p-6 md:p-10 rounded-[2.5rem]" variant="obsidian" gradientBorder>
        {/* AI Analysis */}
        {isAiAnalyzing && (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="py-12 text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <motion.div className="absolute inset-0 rounded-full border-4 border-sovereign-gold/20" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
              <motion.div className="absolute inset-2 rounded-full border-4 border-transparent border-t-sovereign-gold" animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
              <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-12 h-12 text-sovereign-gold" /></div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-sovereign-gold">جارٍ التحليل بالذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">يتم فحص جودة الصورة ووضوح الوجه والتأكد من مطابقة المعايير المطلوبة</p>
            <div className="mt-6 flex justify-center gap-4">
              {['فحص الجودة', 'كشف الوجه', 'التحقق من الوضوح'].map((step, i) => (
                <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin text-sovereign-gold" />{step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Captured Photo */}
        {!isAiAnalyzing && capturedPhoto && (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="text-center">
            <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 border-sovereign-gold/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedPhoto} alt="الصورة الملتقطة" className="w-full h-full object-cover" />
              <div className="absolute inset-0 rounded-full border-2 border-sovereign-gold/50 pointer-events-none" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-emerald-400">تم التقاط الصورة بنجاح</h3>
            <p className="text-sm text-muted-foreground mb-6">تحقق من الصورة ثم اضغط على زر التحليل</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SovereignButton variant="primary" size="md" onClick={onSubmitAI} isLoading={isAiAnalyzing}><Sparkles className="w-4 h-4" /> تحليل بالذكاء الاصطناعي</SovereignButton>
              <SovereignButton variant="secondary" size="md" onClick={onRetakePhoto}><RotateCcw className="w-4 h-4" /> إعادة التقاط</SovereignButton>
            </div>
          </motion.div>
        )}

        {/* Initial state */}
        {!isAiAnalyzing && !capturedPhoto && !cameraActive && !cameraError && (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="text-center py-8">
            <div className="w-64 h-64 mx-auto mb-6 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
              <Camera className="w-16 h-16 text-sovereign-gold/50" />
            </div>
            <h3 className="text-lg font-bold mb-2">التقط صورة لوجهك</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">تأكد من إضاءة جيدة ووضع وجهك داخل الإطار مع النظر مباشرة للكاميرا</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SovereignButton variant="primary" size="md" onClick={onStartCamera}><Camera className="w-4 h-4" /> تشغيل الكاميرا</SovereignButton>
              <SovereignButton variant="secondary" size="md" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /> رفع صورة</SovereignButton>
            </div>
          </motion.div>
        )}

        {/* Camera error */}
        {!isAiAnalyzing && !capturedPhoto && cameraError && (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="text-center py-8">
            <div className="w-64 h-64 mx-auto mb-6 rounded-full border-2 border-dashed border-red-500/20 flex items-center justify-center bg-red-500/5">
              <CameraOff className="w-16 h-16 text-red-400/50" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-red-400">لا يمكن الوصول للكاميرا</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">يبدو أن الكاميرا غير متاحة. يمكنك رفع صورة شخصية من جهازك بدلاً من ذلك.</p>
            <SovereignButton variant="primary" size="md" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /> رفع صورة من الجهاز</SovereignButton>
          </motion.div>
        )}

        {/* Active camera */}
        {!isAiAnalyzing && !capturedPhoto && cameraActive && (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="text-center">
            <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 256 256" className="w-full h-full" style={{ transform: 'scaleX(-1)' }}>
                  <ellipse cx="128" cy="120" rx="70" ry="90" fill="none" stroke="rgba(234,179,8,0.6)" strokeWidth="2" strokeDasharray="8 4" />
                  <ellipse cx="128" cy="120" rx="70" ry="90" fill="rgba(234,179,8,0.05)" stroke="none" />
                </svg>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-sovereign-gold/60 rounded-tr-lg" />
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-sovereign-gold/60 rounded-tl-lg" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-sovereign-gold/60 rounded-br-lg" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-sovereign-gold/60 rounded-bl-lg" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">ضع وجهك داخل الإطار ثم اضغط على زر الالتقاط</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileTap={{ scale: 0.9 }}>
                <button onClick={onCapturePhoto} className="w-20 h-20 rounded-full bg-gradient-to-b from-sovereign-gold to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] transition-shadow duration-300">
                  <Camera className="w-8 h-8 text-sovereign-black" />
                </button>
              </motion.div>
              <SovereignButton variant="ghost" size="md" onClick={onStopCamera}><XCircle className="w-4 h-4" /> إلغاء</SovereignButton>
            </div>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input type="file" ref={fileInputRef} onChange={onFileUpload} accept="image/jpeg,image/png,image/webp" className="hidden" />
      </GlassPanel>
    </motion.div>
  );
}

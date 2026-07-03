"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Key,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Sovereign2FAEnrollment - The Guardian's Initiation.
 * Moved to src/shared/components/sovereign/2fa-enrollment.tsx (Phase 11).
 * 
 * Principles:
 * - Absolute Security: Multi-step verification.
 * - Visual Trust: Emerald & Gold highlights.
 * - Pill & Airy: Deep radius (40px) and breathable spacing.
 */

export function Sovereign2FAEnrollment() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: QR, 3: Verify & Success
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [token, setToken] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await authApi.generate2FASecret();
      setQrData(res.data);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message_ar || "فشل في توليد رمز الأمان");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (token.length !== 6) return;
    setLoading(true);
    try {
      await authApi.enable2FA({ secret: qrData!.secret, token });
      setIsSuccess(true);
      setStep(3);
      toast.success("تم تفعيل المصادقة الثنائية بنجاح");
    } catch (err: any) {
      toast.error(err.response?.data?.message_ar || "الرمز غير صحيح");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel className="p-12 max-w-2xl mx-auto" variant="obsidian" gradientBorder>
      
      {/* 🛡️ Sovereign Identity Emblem */}
      <div className="absolute top-0 left-0 p-12 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-sovereign-gold" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-10" dir="rtl">
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
               key="step-1"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
               className="space-y-10 py-6"
            >
               <div className="w-24 h-24 bg-sovereign-gold/10 rounded-[32px] flex items-center justify-center mx-auto border border-sovereign-gold/20 shadow-2xl relative group">
                  <ShieldCheck className="w-12 h-12 text-sovereign-gold animate-soft-pulse" />
                  <div className="absolute inset-0 bg-sovereign-gold/5 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
               
               <div className="space-y-4">
                  <h3 className="text-4xl font-black italic tracking-tighter leading-tight">الحارس السيادي <span className="text-sovereign-gold">(2FA)</span></h3>
                  <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed font-medium">
                     قم بتفعيل بروتوكول المصادقة الثنائية لتأمين هويتك وأصولك السيادية. هذا الإجراء يرفع معامل الأمان الخاص بك إلى فئة النخبة.
                  </p>
               </div>

               <SovereignButton 
                  onClick={startSetup} 
                  isLoading={loading}
                  size="lg" 
                  variant="primary"
                  className="px-20" 
                  withShimmer
               >
                  بدء التفعيل الآمن
               </SovereignButton>
            </motion.div>
          )}

          {step === 2 && qrData && (
            <motion.div 
               key="step-2"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
               className="space-y-10 w-full max-w-sm"
            >
               <div className="space-y-3">
                  <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold">الخطوة الثانية: المسح الضوئي</Badge>
                  <h4 className="text-2xl font-black italic tracking-tight">امسح رمز الاستجابة (QR)</h4>
                  <p className="text-xs text-white/40 italic">استخدم تطبيق Google Authenticator أو Microsoft Authenticator</p>
               </div>

               <div className="p-8 bg-white rounded-[48px] shadow-[0_0_80px_rgba(197,160,89,0.15)] mx-auto w-fit border-[12px] border-sovereign-gold/5 relative group transition-transform hover:scale-105 duration-700">
                  <img 
                    src={`data:image/png;base64,${qrData.qr_code}`} 
                    alt="2FA QR Code" 
                    className="w-48 h-48 mix-blend-multiply" 
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[36px] flex items-center justify-center backdrop-blur-[2px]">
                     <QrCode className="w-12 h-12 text-sovereign-gold" />
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" />
                        <span>بروتوكول التحقق اليدوي</span>
                    </div>
                    
                    <input 
                        type="text" 
                        maxLength={6}
                        placeholder="000 000"
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-20 bg-white/5 border border-white/10 rounded-[24px] text-center text-4xl font-black font-mono tracking-[0.4em] focus:border-sovereign-gold/40 focus:ring-2 focus:ring-sovereign-gold/10 transition-all outline-none"
                    />
                  </div>

                  <div className="flex gap-4">
                     <SovereignButton 
                        onClick={() => setStep(1)} 
                        variant="ghost" 
                        className="flex-1"
                     >
                        تراجع
                     </SovereignButton>
                     <SovereignButton 
                        onClick={verifyAndEnable} 
                        isLoading={loading}
                        disabled={token.length !== 6}
                        className="flex-[2]"
                        withShimmer
                     >
                        تأكيد السيادة
                     </SovereignButton>
                  </div>
               </div>
            </motion.div>
          )}

          {step === 3 && isSuccess && (
            <motion.div 
               key="step-3"
               initial={{ opacity: 0, scale: 1.1 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
               className="space-y-10 py-10"
            >
               <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-soft-pulse" />
               </div>

               <div className="space-y-3">
                  <h3 className="text-4xl font-black text-emerald-400 italic tracking-tighter">هويتك الآن محصنة!</h3>
                  <p className="text-sm text-white/50 italic font-medium">تم تفعيل الحارس السيادي. حسابك الآن يتبع بروتوكولات الأمان العالمية للنخبة.</p>
               </div>

               <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] max-w-sm mx-auto flex flex-col items-center gap-4">
                   <div className="flex items-center gap-3 text-emerald-400 text-xs font-black uppercase tracking-widest">
                      <Smartphone className="w-5 h-5" />
                      <span>Sovereign Security Shield</span>
                   </div>
                   <p className="text-[11px] text-white/40 leading-relaxed">
                      يُطلب منك الآن إدخال رمز الأمان عند إجراء العمليات المالية الكبرى أو تعديل بيانات الهوية الحساسة.
                   </p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </GlassPanel>
  );
}

const Badge = ({ children, variant, className }: any) => (
  <span className={cn(
    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic",
    variant === 'outline' ? "border border-current" : "bg-current/10 border border-current/20",
    className
  )}>
    {children}
  </span>
);

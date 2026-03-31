"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Calendar, Wallet, PenTool, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import { GlassPanel } from '@/components/sovereign/glass-panel';
import { SovereignSparkle } from '@/components/sovereign/sovereign-sparkle';

interface SovereignCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    startDate: Date | null;
    endDate: Date | null;
    totalPrice: number;
    onConfirm: (signature: string, artisanId?: number) => void;
    isProcessing: boolean;
}

export function SovereignCheckoutModal({
    isOpen,
    onClose,
    product,
    startDate,
    endDate,
    totalPrice,
    onConfirm,
    isProcessing
}: SovereignCheckoutModalProps) {
    const [step, setStep] = React.useState<'review' | 'sign' | 'sealing' | 'sealed'>('review');
    const [signature, setSignature] = React.useState<string | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);

    // Canvas Logic (Minimal for Masterpiece)
    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#B89F67';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const handleConfirmSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setStep('sealing');
        setTimeout(() => {
            setStep('sealed');
            setTimeout(() => {
                onConfirm(canvas.toDataURL());
            }, 1000);
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
            <DialogContent className="max-w-4xl bg-background border-none p-0 overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(184,159,103,0.1)]" dir="rtl">
                
                {/* Header Context */}
                <div className="p-10 bg-gradient-to-l from-sovereign-gold/10 to-transparent border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sovereign-gold/5 rounded-full blur-[80px]" />
                    <DialogTitle className="text-4xl font-black flex items-center gap-4 relative z-10 italic">
                        <ShieldCheck className="w-10 h-10 text-sovereign-gold" />
                        {step === 'review' ? 'مراجعة الميثاق السيادي' : 
                         step === 'sign' ? 'توقيع الإرادة الرقمية' : 'ختم العقد...'}
                    </DialogTitle>
                </div>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {step === 'review' && (
                            <motion.div 
                                key="review"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-10"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Asset Under Contract</p>
                                            <h3 className="text-2xl font-black">{product?.name_ar}</h3>
                                        </div>
                                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">فترة الحجز:</span>
                                                <span className="font-bold font-mono tracking-tighter" dir="ltr">
                                                   {startDate?.toLocaleDateString('ar-DZ')} → {endDate?.toLocaleDateString('ar-DZ')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">قيمة الإيجار:</span>
                                                <span className="font-bold">{totalPrice.toLocaleString()} دج</span>
                                            </div>
                                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                               <p className="text-sm font-black">إجمالي الضمان (Escrow):</p>
                                               <p className="text-3xl font-black text-sovereign-gold">{totalPrice.toLocaleString()} <span className="text-xs font-normal">DA</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-sovereign-gold" /> بروتوكول الحماية
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            "بإبرام هذا العقد، تلتزم ReadyRent بحماية الأصل خلال فترة الحجز، وتجميد مبلغ الضمان في حساب الضمان السيادي (Escrow) لضمان حقوق كافة الأطراف."
                                        </p>
                                        <GlassPanel className="p-6 bg-emerald-500/5 border-emerald-500/10">
                                            <div className="flex items-center gap-4">
                                               <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                               <p className="text-xs font-bold text-emerald-500">ميثاق الثقة السيادي مفعل لهذا الحجز</p>
                                            </div>
                                        </GlassPanel>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Sovereign Registry System V2.1</p>
                                    <SovereignButton onClick={() => setStep('sign')} variant="primary" size="xl" className="px-16" withShimmer>
                                        الانتقال للتوقيع <ArrowRight className="w-5 h-5 ml-4" />
                                    </SovereignButton>
                                </div>
                            </motion.div>
                        )}

                        {step === 'sign' && (
                            <motion.div 
                                key="sign"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8 flex flex-col items-center"
                            >
                                <div className="text-center space-y-2">
                                    <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-0 uppercase tracking-widest text-[10px]">Digital Signature Required</Badge>
                                    <h3 className="text-2xl font-black">خط التوقيع السيادي</h3>
                                </div>

                                <div className="w-full h-64 bg-background border-2 border-dashed border-sovereign-gold/20 rounded-[2.5rem] relative cursor-crosshair group overflow-hidden">
                                     <canvas
                                        ref={canvasRef}
                                        width={800}
                                        height={300}
                                        className="w-full h-full touch-none relative z-10"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                    <PenTool className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-sovereign-gold/5 pointer-events-none" />
                                </div>

                                <div className="flex gap-4 w-full">
                                    <SovereignButton onClick={() => setStep('review')} variant="secondary" className="flex-1">العودة للمراجعة</SovereignButton>
                                    <SovereignButton onClick={handleConfirmSignature} variant="primary" className="flex-1" withShimmer>ختم العقد وتوثيقه</SovereignButton>
                                </div>
                            </motion.div>
                        )}

                        {step === 'sealing' && (
                            <motion.div 
                                key="sealing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 space-y-8"
                            >
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotate: 360 }} 
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-24 h-24 border-b-2 border-sovereign-gold rounded-full"
                                    />
                                    <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-sovereign-gold animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black">جاري الختم السيادي...</h3>
                                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-black opacity-40">Initializing Immutable Chain</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'sealed' && (
                            <motion.div 
                                key="sealed"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 space-y-8"
                            >
                                <SovereignSparkle active={true}>
                                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-3xl shadow-emerald-500/20">
                                        <CheckCircle2 className="w-12 h-12 text-black" />
                                    </div>
                                </SovereignSparkle>
                                <h3 className="text-3xl font-black italic">تـم الـخـتـم بنجاح</h3>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </DialogContent>
        </Dialog>
    );
}

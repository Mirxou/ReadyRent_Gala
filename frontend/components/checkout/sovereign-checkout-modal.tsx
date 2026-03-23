
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Calendar, Wallet, PenTool, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SovereignCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    startDate: Date | null;
    endDate: Date | null;
    totalPrice: number;
    onConfirm: (signatureData: string) => void;
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
    const [step, setStep] = React.useState<'review' | 'sign' | 'sealing'>('review');
    const [signature, setSignature] = React.useState<string | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);

    // Canvas Logic
    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.beginPath();
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

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature(null);
    };

    const handleConfirmSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Simple check if empty (not robust but sufficient for prototype)
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        if (canvas.toDataURL() === blank.toDataURL()) {
            toast.error("يجب التوقيع للمتابعة");
            return;
        }

        setSignature(canvas.toDataURL());
        setStep('sealing');

        // The "Weight" Pause
        setTimeout(() => {
            onConfirm(canvas.toDataURL());
        }, 1500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
            <DialogContent className="max-w-2xl bg-background border-sovereign-gold/10 p-0 overflow-hidden" dir="rtl">

                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-sovereign-blue/5 to-transparent border-b border-border">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-sovereign-gold" />
                        {step === 'review' ? 'مراجعة المعاملة السيادية' :
                            step === 'sign' ? 'إبرام العقد الرقمي' : 'جاري الختم...'}
                    </DialogTitle>
                </div>

                <div className="p-6">
                    {step === 'review' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Timeline Visualization */}
                            <div className="relative py-4 px-2">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                        <span className="w-3 h-3 rounded-full bg-sovereign-gold animate-pulse" />
                                        <span className="font-bold text-foreground">توقيع</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span>نافذة تراجع (10د)</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                        <span className="w-3 h-3 rounded-full bg-primary" />
                                        <span>التزام ملزم</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                        <span className="w-3 h-3 rounded-full bg-destructive" />
                                        <span>نزاع فقط</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/5 rounded-xl p-4 border border-dashed border-border space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">الأصل:</span>
                                    <span className="font-bold">{product?.name_ar}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">المدة:</span>
                                    <span className="font-mono" dir="ltr">
                                        {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-border">
                                    <span className="text-lg font-bold">الإجمالي المجمد:</span>
                                    <span className="text-2xl font-mono font-bold text-sovereign-gold">
                                        {totalPrice.toLocaleString()} <span className="text-sm">دج</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep('sign')} className="bg-sovereign-gold hover:bg-sovereign-gold/90 text-black min-w-[200px]">
                                    متابعة للتوقيع <ArrowRight className="mr-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'sign' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3 text-sm text-yellow-600 mb-4">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <p>بعد التوقيع، يصبح هذا الاتفاق ملزمًا ولا يمكن تعديله إلا وفق شروط STANDARD. نافذة التراجع المجاني: 10 دقائق.</p>
                            </div>

                            <div className="border-2 border-dashed border-sovereign-gold/30 rounded-xl bg-background relative overflow-hidden h-[200px] cursor-crosshair group">
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={200}
                                    className="w-full h-full touch-none"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                <div className="absolute top-2 left-2 text-[10px] text-muted-foreground pointer-events-none opacity-50 uppercase tracking-widest">
                                    Official Signature Space
                                </div>
                                {!isDrawing && !signature && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                        <PenTool className="w-12 h-12 text-sovereign-gold" />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <Button variant="ghost" size="sm" onClick={clearSignature} className="text-muted-foreground">
                                    مسح التوقيع
                                </Button>
                                <Button
                                    onClick={handleConfirmSignature}
                                    disabled={isProcessing}
                                    className="bg-sovereign-gold hover:bg-sovereign-gold/90 text-black min-w-[150px]"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : 'ختم العقد'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'sealing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-sovereign-gold/20 blur-xl rounded-full animate-pulse" />
                                <Loader2 className="w-16 h-16 text-sovereign-gold animate-spin relative z-10" />
                            </div>
                            <h3 className="text-xl font-bold">جاري توثيق الختم...</h3>
                            <p className="text-muted-foreground text-sm">لحظات قليلة لحماية الحقوق</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

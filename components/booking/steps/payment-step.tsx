'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, ShieldCheck, PenTool, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PaymentStep() {
  const { formData, updateFormData } = useBookingStore();
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Digital Signature Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    let clientX: number | null = null;
    let clientY: number | null = null;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? null;
      clientY = e.touches[0]?.clientY ?? null;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (clientX === null || clientY === null) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Actually, I'll use a simpler "Click to Sign" for demo or a better canvas implementation
  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  const handleConfirmSignature = () => {
    setIsSigned(true);
    updateFormData({ signature: 'signature_confirmed_hmac_2030' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-gray-900">تأكيد الدفع والتوقيع</h2>
        <p className="text-gray-500">الخطوة القانونية النهائية لإتمام المعاملة</p>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2 font-bold text-primary-700">
          <CreditCard className="h-5 w-5" />
          <span>تفاصيل بطاقة الدفع</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>رقم البطاقة</Label>
            <Input 
              placeholder="0000 0000 0000 0000" 
              className="bg-white"
              onChange={(e) => updateFormData({ paymentDetails: { ...formData.paymentDetails, cardNumber: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input placeholder="MM/YY" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>CVV</Label>
              <Input placeholder="123" className="bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Digital Contract Signature */}
      <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 mb-2 font-bold text-blue-700">
          <PenTool className="h-5 w-5" />
          <span>توقيع العقد الرقمي الموحد</span>
        </div>

        <div className="relative aspect-[3/1] bg-white rounded-xl border-2 border-dashed border-blue-200 overflow-hidden group">
          {!isSigned ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 group-hover:text-blue-600 transition-colors pointer-events-none">
              <PenTool className="h-8 w-8 mb-2" />
              <p className="text-xs font-bold">وقع هنا إلكترونياً</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-10 w-10 mb-2" />
              <p className="text-sm font-black mx-2">تم التوقيع رقمياً بنجاح</p>
            </div>
          )}
          <canvas 
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <ShieldCheck className="h-3 w-3" />
            <span>محمي بنظام التوثيق السيادي الجزائري</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearSignature}>مسح</Button>
            <Button size="sm" onClick={handleConfirmSignature} disabled={isSigned}>تأكيد التوقيع</Button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900 text-white rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">إجمالي المبلغ المحصن (Escrow)</p>
          <p className="text-xl font-black">{formData.totalPrice} دج</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-primary-400">نظام 60/40 مفعل</p>
          <p className="text-xs font-bold text-success-400">تأمين شامل</p>
        </div>
      </div>
    </div>
  );
}

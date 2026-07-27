'use client';

import React, { useRef, useState } from 'react';

import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { Button } from '@/components/ui/button';
import { PenTool, ShieldCheck, CheckCircle2, Wallet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PaymentStep() {
  const { formData, updateFormData } = useBookingStore();
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Digital Signature Logic — canvas-based
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
    setSignatureData(null);
    updateFormData({ signature: undefined });
  };

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Capture real canvas drawing as data URL
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
    setIsSigned(true);
    updateFormData({ signature: dataUrl });
  };

  const isWalletPayment = formData.paymentMethod === 'wallet';
  const isBaridimob = formData.paymentMethod === 'baridimob';

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-gray-900">تأكيد الدفع والتوقيع</h2>
        <p className="text-gray-500">الخطوة القانونية النهائية لإتمام المعاملة</p>
      </div>

      {/* Payment Method Summary — real payment is handled by the API */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2 font-bold text-gray-700">
          {isWalletPayment ? (
            <Wallet className="h-5 w-5" />
          ) : isBaridimob ? (
            <Smartphone className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
          <span>
            {isWalletPayment
              ? 'الدفع من المحفظة الرقمية'
              : isBaridimob
              ? 'الدفع عبر باريديموب'
              : 'الدفع بالبطاقة البنكية'}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">طريقة الدفع</span>
            <span className="font-bold">
              {isWalletPayment
                ? 'المحفظة الرقمية (STANDARD.Rent)'
                : isBaridimob
                ? 'باريديموب (BaridiMob)'
                : 'بطاقة بنكية'}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          سيتم توجيهك لإتمام الدفع بعد التوقيع على العقد
        </p>
      </div>

      {/* Digital Contract Signature */}
      <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 mb-2 font-bold text-blue-700">
          <PenTool className="h-5 w-5" />
          <span>توقيع العقد الرقمي</span>
        </div>

        <div className="relative aspect-[3/1] bg-white rounded-xl border-2 border-dashed border-blue-200 overflow-hidden group">
          {!isSigned ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 group-hover:text-blue-600 transition-colors pointer-events-none">
              <PenTool className="h-8 w-8 mb-2" />
              <p className="text-xs font-bold">وقع هنا إلكترونياً</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center text-green-600 pointer-events-none">
              <CheckCircle2 className="h-10 w-10 mb-2" />
              <p className="text-sm font-black mx-2">تم التوقيع رقمياً بنجاح</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <ShieldCheck className="h-3 w-3" />
            <span>محمي بنظام التوثيق الرقمي</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearSignature}>مسح</Button>
            <Button
              size="sm"
              onClick={handleConfirmSignature}
              disabled={isSigned}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              تأكيد التوقيع
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900 text-white rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">إجمالي المبلغ المحصن (Escrow)</p>
          <p className="text-xl font-black">{formData.totalPrice?.toLocaleString('ar-DZ')} دج</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-green-400">{isWalletPayment ? 'محفظة رقمية' : isBaridimob ? 'باريديموب' : 'بطاقة بنكية'}</p>
          <p className="text-xs font-bold text-green-400">تأمين شامل</p>
        </div>
      </div>
    </div>
  );
}

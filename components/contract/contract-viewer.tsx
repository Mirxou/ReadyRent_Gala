'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ShieldCheck, 
  User, 
  Clock, 
  Globe, 
  Fingerprint, 
  CheckCircle2, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Contract } from '@/lib/api/contracts';
import { toast } from 'sonner';

interface ContractViewerProps {
  contract: Contract;
  onSign: (signatureData: string) => Promise<void>;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({ contract, onSign }) => {
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentUser = contract.parties?.find((p) => p.role === 'renter'); // demo assumption
  const isFinalized = contract.status === 'finalized' || contract.status === 'signed' || contract.is_finalized === true;

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setSignature(null);
      }
    }
  };

  const handleSign = async () => {
    if (!signature) {
      toast.error('يرجى التوقيع أولاً');
      return;
    }
    await onSign(signature);
    setIsSigning(false);
    toast.success('تم التوقيع بنجاح');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-700 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            عقد تأجير رقمي سيادي
          </h1>
          <p className="text-slate-500 text-sm mt-1">المعرف الفريد: {contract.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isFinalized ? "default" : "secondary"} className="px-4 py-1.5 text-sm">
            {isFinalized ? 'مكتمل وموثق' : 'بانتظار التواقيع'}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} />
            تحميل PDF
          </Button>
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
        {(contract.parties ?? []).map((party) => (
          <Card key={party.id} className="p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-1 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-100 rounded-xl">
                <User className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{party.role === 'renter' ? 'المستأجر' : 'المؤجر'}</p>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{party.name}</h3>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                <span className="text-slate-500 flex items-center gap-1.5 ml-2">
                  <ShieldCheck size={14} /> الحالة
                </span>
                <span className={party.signed ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                  {party.signed ? 'تم التوقيع' : 'لم يوقع بعد'}
                </span>
              </div>
              {party.signed && (
                <>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-slate-500 flex items-center gap-1.5 ml-2">
                      <Clock size={14} /> التاريخ
                    </span>
                    <span className="text-slate-700">{new Date(party.signedAt!).toLocaleString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-slate-500 flex items-center gap-1.5 ml-2">
                      <Globe size={14} /> الـ IP
                    </span>
                    <span className="text-slate-700 font-mono text-xs">{party.ipAddress}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Terms Section */}
      <Card className="p-8 bg-white border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <ShieldCheck className="text-green-600" />
          البنود القانونية والضمانات
        </h2>
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-serif" dir="rtl">
          {typeof contract.terms === 'string'
            ? contract.terms.split('\n').map((para: string, i: number) => (
                <p key={i} className="mb-4">{para.trim()}</p>
              ))
            : null}
        </div>
        
        <Separator className="my-8" />
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800" dir="rtl">
            <strong>تنبيه سيادي:</strong> هذا العقد محمي بتقنيات التشفير المتقدمة. أي تعديل غير مصرح به سيبطل صحة العقد تلقائياً وسيتم رصده من قبل النظام القضائي للمنصة.
          </div>
        </div>
      </Card>

      {/* Signature Section */}
      <AnimatePresence>
        {!isFinalized && currentUser && !currentUser.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            {isSigning ? (
              <div className="w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Fingerprint className="text-indigo-600" />
                    التوقيع الرقمي السيادي
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-slate-500">مسح</Button>
                </div>
                <div className="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl h-64 cursor-crosshair group overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={256}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full"
                  />
                  {!signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 opacity-50 flex-col gap-2">
                      <Fingerprint size={48} />
                      <p className="text-sm">وقع هنا باستخدام الماوس أو اللمس</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button className="flex-1 h-12 text-lg font-bold" onClick={handleSign}>أؤكد التوقيع</Button>
                  <Button variant="outline" className="h-12 px-6" onClick={() => setIsSigning(false)}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="px-12 py-8 text-xl font-bold rounded-2xl shadow-xl hover:shadow-indigo-200/50 transition-all gap-4 ring-offset-2 ring-indigo-500 hover:ring-2"
                onClick={() => setIsSigning(true)}
              >
                <Fingerprint size={28} />
                توقيع العقد الآن
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Meta */}
      <div className="flex flex-col items-center gap-2 text-slate-400 text-xs pb-12">
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-green-500" />
          وثيقة محمية بنظام ReadyRent السيادي
        </div>
        <div className="font-mono bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
          HASH: {contract.contract_hash}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ContractParty {
  id: string;
  name: string;
  role: string;
  signed?: boolean;
  signedAt?: string;
  ipAddress?: string;
}

interface Contract {
  id: string;
  booking_id: string;
  status: string;
  is_finalized: boolean;
  contract_hash: string | null;
  renter_signature?: string | null;
  signed_at?: string | null;
  snapshot: Record<string, unknown>;
  parties?: ContractParty[];
  terms?: string | null;
  created_at?: string;
}

interface ContractViewerProps {
  contract: Contract;
  onSign: () => Promise<void>;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة — بانتظار التوقيع', variant: 'outline' },
  signed: { label: 'موقّع', variant: 'default' },
  finalized: { label: 'مكتمل وموثّق', variant: 'default' },
  expired: { label: 'منتهي الصلاحية', variant: 'destructive' },
};

export const ContractViewer: React.FC<ContractViewerProps> = ({ contract, onSign }) => {
  // BUG-11: Merged isSigning+signing into a single state machine
  const [signingState, setSigningState] = useState<'idle' | 'confirming' | 'signing'>('idle');

  const currentUser = contract.parties?.find((p) => p.role === 'renter');
  const isSigned = contract.status === 'signed' || contract.status === 'finalized' || contract.status === 'expired';
  const cfg = statusConfig[contract.status] || statusConfig.draft;

  const handleSign = async () => {
    setSigningState('signing');
    try {
      await onSign();
      toast.success('تم التوقيع بنجاح');
    } catch {
      toast.error('فشل التوقيع. يرجى المحاولة مرة أخرى.');
    } finally {
      setSigningState('idle');
    }
  };

  // Parse terms into sections for structured display
  const termSections = typeof contract.terms === 'string'
    ? contract.terms.split('\n\n---\n\n').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-700 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-amber-600" />
            عقد إيجار رقمي — STANDARD.Rent
          </h1>
          <p className="text-slate-500 text-sm mt-1">المعرف الفريد: {contract.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={cfg.variant} className="px-4 py-1.5 text-sm">
            {cfg.label}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Download size={16} />
                تحميل PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>قريباً</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
        {(contract.parties ?? []).map((party) => (
          <Card key={party.id} className="p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-1 h-full bg-slate-200 group-hover:bg-amber-500 transition-colors" />
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
                <span className={party.signed ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  {party.signed ? 'تم التوقيع' : 'لم يوقع بعد'}
                </span>
              </div>
              {party.signed && party.signedAt && (
                <div className="flex justify-between items-center p-2">
                  <span className="text-slate-500 flex items-center gap-1.5 ml-2">
                    <Clock size={14} /> التاريخ
                  </span>
                  <span className="text-slate-700">{new Date(party.signedAt).toLocaleString('ar-DZ')}</span>
                </div>
              )}
              {party.signed && party.ipAddress && (
                <div className="flex justify-between items-center p-2">
                  <span className="text-slate-500 flex items-center gap-1.5 ml-2">
                    <Globe size={14} /> الـ IP
                  </span>
                  <span className="text-slate-700 font-mono text-xs">{party.ipAddress}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Terms Section — Structured 7-section display */}
      <Card className="p-8 bg-white border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <ShieldCheck className="text-green-600" />
          البنود القانونية والضمانات
        </h2>
        <div className="space-y-8 text-slate-700 leading-relaxed" dir="rtl">
          {termSections.map((section, i) => {
            const lines = section.split('\n');
            const title = lines[0];
            const body = lines.slice(1).join('\n');
            return (
              <div key={i}>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <div className="text-sm text-slate-600 whitespace-pre-line">{body}</div>
                {i < termSections.length - 1 && <Separator className="mt-6" />}
              </div>
            );
          })}
        </div>
        
        <Separator className="my-8" />
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800" dir="rtl">
            <strong>تنبيه:</strong> هذا العقد محمي بتشفير SHA-256. أي تعديل غير مصرح به سيبطل صحة الهاش ويمكن اكتشافه. يخضع للقانون الجزائري رقم 18-05.
          </div>
        </div>
      </Card>

      {/* Signature Section — Simple button (no canvas, signature is server-side) */}
      <AnimatePresence>
        {!isSigned && currentUser && !currentUser.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            {signingState === 'confirming' || signingState === 'signing' ? (
              <div className="w-full max-w-lg space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Fingerprint className="w-16 h-16 text-amber-500 mx-auto" />
                <h3 className="font-bold text-slate-900 text-lg">توقيع العقد رقمي</h3>
                <p className="text-sm text-slate-500" dir="rtl">
                  بضغطك على &quot;أوقّع العقد&quot; فإنك توافق على جميع البنود المذكورة أعلاه.
                  سيتم تسجيل التوقيع مع عنوان IP الخاص بك.
                </p>
                <div className="flex gap-4 pt-4">
                  <Button
                    className="flex-1 h-12 text-base font-bold"
                    onClick={handleSign}
                    disabled={signingState === 'signing'}
                  >
                    {signingState === 'signing' ? 'جاري التوقيع...' : 'أوقّع العقد'}
                  </Button>
                  <Button variant="outline" className="h-12 px-6" onClick={() => setSigningState('idle')}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="px-12 py-8 text-xl font-bold rounded-2xl shadow-xl hover:shadow-amber-200/50 transition-all gap-4 ring-offset-2 ring-amber-500 hover:ring-2"
                onClick={() => setSigningState('confirming')}
              >
                <Fingerprint size={28} />
                توقيع العقد الآن
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signed confirmation */}
      {isSigned && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 px-6 py-3 rounded-xl">
            <CheckCircle2 className="text-green-600" size={24} />
            <span className="text-green-800 font-bold">تم توقيع العقد{contract.signed_at ? ` في ${new Date(contract.signed_at).toLocaleDateString('ar-DZ')}` : ''}</span>
          </div>
        </div>
      )}

      {/* Footer / Meta */}
      <div className="flex flex-col items-center gap-2 text-slate-400 text-xs pb-12">
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-green-500" />
          وثيقة محمية بنظام STANDARD.Rent
        </div>
        {contract.contract_hash && (
          <div className="font-mono bg-slate-100 px-3 py-1 rounded-full text-[10px] tracking-wider">
            SHA-256: {contract.contract_hash.slice(0, 16)}…{contract.contract_hash.slice(-8)}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { judgmentsApi, appealsApi } from '@/lib/api/appeals';
import { disputesApi } from '@/lib/api/disputes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Gavel,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { trackAppealFiled } from '@/lib/analytics';

const APPEAL_REASONS = [
  { id: 'new_evidence', label: 'وجود أدلة جديدة لم تُعرض على المحكمة', icon: '📂' },
  { id: 'procedural_error', label: 'خطأ إجرائي في النظر بالقضية', icon: '⚖️' },
  { id: 'legal_error', label: 'تطبيق خاطئ للشروط والأحكام', icon: '📋' },
  { id: 'disproportionate', label: 'الحكم غير متناسب مع حجم النزاع', icon: '🔍' },
  { id: 'other', label: 'سبب آخر (يُرجى التوضيح)', icon: '✍️' },
];

export default function AppealFilingPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const disputeId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [selectedReason, setSelectedReason] = useState('');
  const [customText, setCustomText] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Get dispute + verdict
  const { data: statusRes, isLoading: loadingDispute } = useQuery({
    queryKey: ['dispute-status', disputeId],
    queryFn: () => disputesApi.getDisputeStatus(Number(disputeId)),
    enabled: !!disputeId,
  });

  const { data: verdictRes, isLoading: loadingVerdict } = useQuery({
    queryKey: ['dispute-verdict', disputeId],
    queryFn: () => disputesApi.getDisputeVerdict(Number(disputeId)),
    enabled: !!disputeId,
  });

  const dispute = statusRes?.data;
  const verdict = verdictRes?.data;

  const { mutate: fileAppeal, isPending } = useMutation({
    mutationFn: async () => {
      if (!verdict?.id) throw new Error('لم يتم العثور على حكم للطعن فيه');
      const reason =
        selectedReason === 'other' ? customText : `${selectedReason}: ${customText}`;
      return appealsApi.fileAppeal(verdict.id, reason);
    },
    onSuccess: () => {
      trackAppealFiled(Number(disputeId), selectedReason);
      setStep('success');
      toast.success('تم تقديم الاستئناف بنجاح');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'فشل تقديم الاستئناف');
    },
  });

  const isLoading = loadingDispute || loadingVerdict;
  const canSubmit = selectedReason && (selectedReason !== 'other' || customText.trim().length > 20);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Guard: only allow appeal on completed disputes with verdicts
  if (!verdict) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-slate-50 dark:bg-slate-950">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          لا يمكن تقديم استئناف
        </h2>
        <p className="text-slate-500 text-center max-w-sm">
          لم يصدر حكم بعد في هذه القضية، أو أن القضية لا تزال قيد النظر.
        </p>
        <Link href={`/disputes/${disputeId}`}>
          <Button variant="outline">العودة إلى ملف القضية</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/disputes" className="hover:text-slate-700 dark:hover:text-slate-200">
          النزاعات
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href={`/disputes/${disputeId}`}
          className="hover:text-slate-700 dark:hover:text-slate-200"
        >
          قضية #{disputeId}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 dark:text-slate-200 font-medium">تقديم استئناف</span>
      </nav>

      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 mb-4">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
                  تقديم استئناف
                </h1>
                <p className="text-slate-500 text-sm">
                  الاستئناف هو حقك القانوني في مراجعة الحكم الصادر. يُنظر فيه
                  من قِبل لجنة استئناف مستقلة.
                </p>
              </div>

              {/* Verdict summary */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <Gavel className="w-4 h-4" />
                  الحكم المطعون فيه
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {verdict.ruling_text || 'حكم قاطع'}
                </p>
                {verdict.renter_share !== undefined && (
                  <div className="mt-3 flex gap-3 text-xs">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      المستأجر: {verdict.renter_share}%
                    </span>
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      المالك: {100 - verdict.renter_share}%
                    </span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  تحذير: الاستئناف غير المبرر قد يؤثر سلبًا على نقاط الثقة الخاصة بك.
                  يُنصح فقط بالاستئناف إذا كانت لديك أسباب موضوعية وجوهرية.
                </p>
              </div>

              {/* Reason selection */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  سبب الاستئناف
                </h3>
                <div className="space-y-2">
                  {APPEAL_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        'w-full text-right flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                        selectedReason === reason.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                      )}
                    >
                      <span className="text-xl">{reason.icon}</span>
                      <span className="text-sm font-medium">{reason.label}</span>
                      {selectedReason === reason.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mr-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason text */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  تفصيل موقفك{selectedReason !== 'other' ? ' (اختياري)' : ' *'}
                </h3>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={5}
                  placeholder="اشرح بالتفصيل أسباب اعتراضك على الحكم، وأي معلومات إضافية أو أدلة تدعم موقفك..."
                  className={cn(
                    'w-full rounded-xl border p-4 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                    selectedReason === 'other' && customText.trim().length < 20
                      ? 'border-red-300'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />
                {selectedReason === 'other' && customText.trim().length < 20 && (
                  <p className="text-xs text-red-500 mt-1">
                    يجب أن يكون التفصيل 20 حرفًا على الأقل
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Link href={`/disputes/${disputeId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    إلغاء
                  </Button>
                </Link>
                <Button
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!canSubmit || isPending}
                  onClick={() => fileAppeal()}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التقديم...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" />
                      تقديم الاستئناف الرسمي
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            // Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
                تم تقديم الاستئناف
              </h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                تم تسجيل استئنافك رسميًا وسيُنظر فيه من قِبل لجنة الاستئناف المستقلة. ستُبلَّغ بأي تطور عبر الإشعارات.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/disputes/${disputeId}`}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    العودة إلى ملف القضية
                  </Button>
                </Link>
                <Link href="/disputes">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    كل النزاعات
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

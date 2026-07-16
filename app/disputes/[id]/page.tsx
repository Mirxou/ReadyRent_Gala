'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { disputesApi } from '@/lib/api';

type DisputeHistoryStage = {
  phase?: string;
  label_ar?: string;
  timestamp?: string;
  description?: string;
  type?: string;
  message?: string;
  created_at?: string;
  is_status_change?: boolean;
  status?: string;
};
import { SovereignSeal } from '@/shared/components/sovereign/sovereign-seal';
import { JusticeReceipt } from '@/shared/components/sovereign/justice-receipt';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { useSovereign } from '@/contexts/SovereignContext';
import { AIDisputeAssistant } from '@/components/disputes/AIDisputeAssistant';
import { AlertCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Map backend status names to Arabic labels
const STATUS_LABELS: Record<string, string> = {
  'filed': 'تقديم النزاع',
  'under_review': 'قيد المراجعة القضائية',
  'mediation': 'جلسة الوساطة',
  'appealed': 'مرحلة الاستئناف',
  'resolved': 'تم الفصل',
  'closed': 'القضية مغلقة',
};

function buildFallbackStages(dispute: any): DisputeHistoryStage[] {
  return [
    {
      label_ar: 'إنشاء النزاع',
      timestamp: dispute?.created_at,
    },
    {
      label_ar: 'التحليل والتصنيف',
    },
    {
      label_ar: STATUS_LABELS[dispute?.status] || dispute?.status || 'قيد المعالجة',
    },
  ];
}

export default function DisputeDetailPage() {
  const params = useParams();
  const idFromParams = params?.id;
  const id = Array.isArray(idFromParams) ? idFromParams[0] : idFromParams;

  const { setMode, setVisualAssets } = useSovereign();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState<any | null>(null);
  const [receiptStages, setReceiptStages] = useState<DisputeHistoryStage[]>([]);

  const isResolved = dispute?.status === 'resolved' || dispute?.status === 'closed';

  useEffect(() => {
    async function fetchDisputeData() {
      if (!id) return;

      try {
        setMode('DISPUTE');
        setLoading(true);

        // Single fetch for dispute (replaces getDisputeStatus + getDisputeVerdict)
        const res = await disputesApi.getDispute(id);

        if (res.meta?.failed) {
          setLoading(false);
          return;
        }

        setDispute(res.data);

        if (res.data?.status === 'resolved' || res.data?.status === 'closed') {
          setMode('VERDICT');
        }

        // Try real backend history, fallback to intelligent stage construction
        try {
          const historyRes = await disputesApi.getDisputeHistory(id);
          if (historyRes.data && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
            setReceiptStages(historyRes.data);
          } else {
            setReceiptStages(buildFallbackStages(res.data));
          }
        } catch {
          setReceiptStages(buildFallbackStages(res.data));
        }

      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error(err);
        setError('تعذر تحميل بيانات النزاع.');
      } finally {
        setLoading(false);
      }
    }

    fetchDisputeData();
  }, [id, setMode, setVisualAssets]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <DignifiedLoader label="جاري استدعاء ملف القضية..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-lg font-serif">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
      <header className="mb-12 text-center md:text-right border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
              ملف النزاع #{id}
            </h1>
            <div className="text-sm text-slate-500 font-mono">
              STATUS: {dispute?.status} {dispute?.claim_type ? `| TYPE: ${dispute.claim_type}` : ''}
            </div>
          </div>
          <SovereignSeal
            type={isResolved ? 'BALANCE_GOLD' : 'SHIELD_SILVER'}
            refId={`DSP-${id}`}
            className="w-24 h-24"
            animate={!isResolved}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Resolution Summary Card (replaces verdict card) */}
          {isResolved && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl border-t-4 border-amber-500">
              <h2 className="text-2xl font-serif font-bold text-amber-600 mb-4">ملخص الفصل في القضية</h2>
              <div className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed space-y-3">
                <p><strong>العنوان:</strong> {dispute?.title || 'بدون عنوان'}</p>
                {dispute?.description && (
                  <p><strong>الوصف:</strong> {dispute.description}</p>
                )}
                <p><strong>نوع الطلب:</strong> {dispute?.claim_type || 'عام'}</p>
                <p><strong>المبلغ المطالب:</strong> {dispute?.claimed_amount || 0} دج</p>
                <p><strong>الحالة النهائية:</strong> {dispute?.status}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 flex justify-between">
                <span>بواسطة: Sovereign Core</span>
                <span>
                  التاريخ: {dispute?.updated_at
                    ? new Date(dispute.updated_at).toLocaleDateString('ar-DZ')
                    : 'N/A'}
                </span>
              </div>
              {/* Appeal CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link href={`/disputes/${id}/appeal`}>
                  <Button 
                    variant="outline" 
                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <Scale className="w-4 h-4" />
                    تقديم استئناف على هذا الحكم
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Dispute Context Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-300">تفاصيل القضية</h3>
            {dispute?.description ? (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {dispute.description}
              </p>
            ) : (
              <p className="text-slate-400 italic">لا توجد تفاصيل إضافية متاحة حالياً.</p>
            )}
            {dispute?.claimed_amount ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <span className="font-medium">المبلغ المطالب به:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {dispute.claimed_amount} دج
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Timeline sidebar */}
        <div className="lg:col-span-1 flex justify-center lg:justify-start">
          <JusticeReceipt
            stages={receiptStages}
            disputeId={id || ''}
          />
        </div>
      </div>
      
      {/* AI Assistant - Floating */}
      <AIDisputeAssistant disputeId={Number(id)} />
    </div>
  );
}
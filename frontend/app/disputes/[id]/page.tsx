'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { disputesApi } from '@/lib/api/disputes';
import { SovereignSeal } from '@/components/sovereign/SovereignSeal';
import { JusticeReceipt } from '@/components/sovereign/JusticeReceipt';
import { DignifiedLoader } from '@/components/sovereign/DignifiedLoader';
import { useSovereign } from '@/contexts/SovereignContext';
import { ReceiptStage } from '@/types/sovereign';
import { AlertCircle } from 'lucide-react';

export default function DisputeDetailPage() {
  const params = useParams();
  const idFromParams = params?.id;
  const id = Array.isArray(idFromParams) ? idFromParams[0] : idFromParams;

  const { setMode, setVisualAssets } = useSovereign();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState<any | null>(null);
  const [receiptStages, setReceiptStages] = useState<ReceiptStage[]>([]);
  const [verdict, setVerdict] = useState<any | null>(null);

  useEffect(() => {
    async function fetchDisputeData() {
      if (!id) return;

      try {
        setMode('DISPUTE');
        setLoading(true);

        const statusRes = await disputesApi.getDisputeStatus(Number(id));

        if (statusRes.status === 'sovereign_halt') {
          setLoading(false);
          return;
        }

        setDispute(statusRes.data);

        if (statusRes.visual_assets) {
          setVisualAssets(statusRes.visual_assets);
          setMode(statusRes.visual_assets.mode);
        }

        if (statusRes.data.current_phase === 'Completed') {
          try {
            // In a real app we would check if verdict exists first or handle 404 gracefully
            const verdictRes = await disputesApi.getDisputeVerdict(Number(id));
            if (verdictRes.data) {
              setVerdict(verdictRes.data);
              setMode('VERDICT');
            }
          } catch (e) {
            console.log('Verdict fetch skipped or failed', e);
          }
        }

        // Mock stages for UI until backend history API is ready
        // We use the status to determine what stages are "done"
        const isCompleted = statusRes.data.current_phase === 'Completed';
        setReceiptStages([
          { label_ar: 'إنشاء النزاع', timestamp: '2026-02-10', status: 'completed' },
          { label_ar: 'المعالجة الآلية', status: 'completed' },
          {
            label_ar: statusRes.data.current_phase || 'قيد المعالجة',
            status: isCompleted ? 'completed' : 'active'
          }
        ]);

      } catch (err) {
        console.error(err);
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
        <button onClick={() => window.location.reload()} className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100">
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
              PHASE: {dispute?.current_phase}
            </div>
          </div>
          <SovereignSeal
            type={verdict ? 'BALANCE_GOLD' : 'SHIELD_SILVER'}
            refId={`DSP-${id}`}
            className="w-24 h-24"
            animate={!verdict}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {verdict && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl border-t-4 border-amber-500">
              <h2 className="text-2xl font-serif font-bold text-amber-600 mb-4">الحُكم القضائي</h2>
              <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
                {verdict.ruling_text || 'تم الفصل في النزاع.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 flex justify-between">
                <span>القاضي: Sovereign Core</span>
                <span>التاريخ: {verdict.finalized_at ? new Date(verdict.finalized_at).toLocaleDateString('ar-DZ') : 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Dispute Context Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-300">تفاصيل القضية</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {dispute ? 'تم جلب السجل بنجاح.' : 'جاري التحميل...'}
              {/* Future: Map real dispute description here */}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 flex justify-center lg:justify-start">
          <JusticeReceipt
            stages={receiptStages}
            disputeId={id || ''}
            finalVerdict={verdict?.verdict}
          />
        </div>
      </div>
    </div>
  );
}

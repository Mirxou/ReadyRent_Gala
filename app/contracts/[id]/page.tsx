'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContractViewer } from '@/components/contract/contract-viewer';
import { ContractTimeline } from '@/components/contract/contract-timeline';
import { contractsApi, Contract } from '@/lib/api/contracts';
import { Loader2, AlertCircle, ChevronRight, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store';

function isErrorResponse(res: { status?: string; httpStatus?: number; success?: boolean }): boolean {
  return (
    res.status === 'sovereign_halt' ||
    (res.httpStatus !== undefined && res.httpStatus >= 400) ||
    res.success === false
  );
}

export default function ContractPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [result, setResult] = useState<{ contract: Contract | null; error: string | null } | null>(null);

  const contract = result?.contract ?? null;
  const loading = result === null;
  const error = result?.error ?? null;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/contracts/${id}`);
      return;
    }
  }, [isAuthenticated, router, id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    contractsApi.getContract(id as string)
      .then((res) => {
        if (isErrorResponse(res)) {
          setResult({ contract: null, error: res.message_en || res.message_ar || 'العقد غير موجود' });
          return;
        }
        setResult({ contract: res.data, error: null });
      })
      .catch(() => {
        setResult({ contract: null, error: 'تعذر تحميل العقد. يرجى التأكد من الرابط أو المحاولة لاحقاً.' });
      });
  }, [id, isAuthenticated]);

  const handleSign = async () => {
    if (!id) return;
    try {
      const res = await contractsApi.signContract(id as string);
      if (isErrorResponse(res)) {
        toast.error(res.message_en || res.message_ar || 'فشل توقيع العقد');
        return;
      }
      setResult({ contract: res.data, error: null });
      toast.success('تم توقيع العقد بنجاح!');
      setTimeout(() => router.push('/dashboard/bookings'), 2000);
    } catch {
      toast.error('فشل توقيع العقد. يرجى المحاولة مرة أخرى.');
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-amber-600" size={48} />
        <p className="text-slate-500 font-medium">جاري تحميل العقد...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-full">
          <AlertCircle className="text-red-600" size={64} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">خطأ</h1>
          <p className="text-slate-500 max-w-sm">{error || 'العقد غير موجود'}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/bookings" className="gap-2">
            العودة للحجوزات
            <ChevronRight size={16} />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/products" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            المنتجات
          </Link>
          <ChevronRight size={14} />
          <Link href="/dashboard/bookings" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            حجوزاتي
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1">
            <LayoutList size={14} />
            عقد رقم {id}
          </span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2">
          <ContractViewer contract={contract} onSign={handleSign} />
        </div>
        <div className="xl:col-span-1 xl:sticky xl:top-24">
          <ContractTimeline contract={contract as unknown as Record<string, unknown>} />
        </div>
      </div>
    </main>
  );
}

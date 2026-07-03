'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractsApi, Contract } from '@/lib/api/contracts';
import { ContractViewer } from '@/components/contract/contract-viewer';
import { ContractTimeline } from '@/components/contract/contract-timeline';
import { Loader2, AlertCircle, ChevronRight, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContractPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const res = await contractsApi.getContract(id as string);
      setContract(res.data);
    } catch {
      setError('تعذر تحميل العقد. يرجى التأكد من الرابط أو المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!id) return;
    try {
      const updatedRes = await contractsApi.signContract(id as string, signatureData);
      setContract(updatedRes.data);
      setTimeout(() => router.push('/wallet'), 3000);
    } catch {
      throw new Error('فشل توقيع العقد');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium">جاري تأمين الاتصال وتوثيق العقد...</p>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">خطأ في النظام</h1>
          <p className="text-slate-500 max-w-sm">{error || 'العقد غير موجود'}</p>
        </div>
        <Button asChild>
          <Link href="/products" className="gap-2">
            العودة للمتصفح
            <ChevronRight size={16} />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-12 pb-24">
      {/* Breadcrumb */}
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

      {/* Two-column layout on large screens */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Main viewer — takes 2/3 */}
        <div className="xl:col-span-2">
          <ContractViewer contract={contract} onSign={handleSign} />
        </div>

        {/* Sidebar: Interactive Timeline — takes 1/3 */}
        <div className="xl:col-span-1 xl:sticky xl:top-24">
          <ContractTimeline contract={contract as any} />
        </div>
      </div>
    </main>
  );
}

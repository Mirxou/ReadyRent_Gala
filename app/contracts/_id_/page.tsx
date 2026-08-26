'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractsApi, Contract } from '@/lib/api/contracts';
import { ContractViewer } from '@/components/contract/contract-viewer';
import { Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContractPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const res = await contractsApi.getContract(id as string);
      setContract(res.data);
    } catch (err) {
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
      // Wait a moment then redirect to wallet or booking success
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);
    } catch (err) {
      throw new Error('فشل توقيع العقد');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium">جاري تأمين الاتصال وتوثيق العقد...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 p-6 text-center">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircle className="text-red-600" size={64} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">خطأ في النظام</h1>
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
    <main className="min-h-screen bg-slate-50 pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <Link href="/products" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm transition-colors w-fit">
          <ChevronRight size={14} />
          العودة للمنتجات
        </Link>
      </div>
      
      <ContractViewer 
        contract={contract} 
        onSign={handleSign} 
      />
    </main>
  );
}

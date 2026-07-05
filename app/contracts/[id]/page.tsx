'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContractViewer } from '@/components/contract/contract-viewer';
import { ContractTimeline } from '@/components/contract/contract-timeline';
import { Contract } from '@/lib/api/contracts';
import { Loader2, AlertCircle, ChevronRight, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

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
      setError(null);
      const res = await fetch(`/api/contracts/digital/${id}/`);
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        // Map mock response fields to Contract interface
        const mapped: Contract = {
          id: typeof d.id === 'string' ? parseInt(d.id.replace(/\D/g, ''), 10) || 1 : (d.id ?? 1),
          booking_id: typeof d.booking_id === 'string' ? parseInt(d.booking_id.replace(/\D/g, ''), 10) || 1 : (d.booking_id ?? 1),
          status: d.status || 'draft',
          is_finalized: d.is_finalized ?? false,
          contract_hash: d.contract_hash || '',
          created_at: d.created_at || new Date().toISOString(),
          signed_at: d.signed_at || undefined,
          renter_signature: d.renter_signature || undefined,
          owner_signature: d.owner_signature || undefined,
          snapshot: d.snapshot || {},
          parties: d.parties || [],
          terms: Array.isArray(d.terms)
            ? d.terms.map((t: Record<string, string>) => typeof t === 'string' ? t : t.text || '').join('\n')
            : (d.terms || ''),
        };
        setContract(mapped);
      } else {
        setError('العقد غير موجود');
      }
    } catch {
      setError('تعذر تحميل العقد. يرجى التأكد من الرابط أو المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/contracts/digital/${id}/sign/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_address: signatureData.slice(0, 20) }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        const mapped: Contract = {
          id: typeof d.id === 'string' ? parseInt(d.id.replace(/\D/g, ''), 10) || 1 : (d.id ?? 1),
          booking_id: typeof d.booking_id === 'string' ? parseInt(d.booking_id.replace(/\D/g, ''), 10) || 1 : (d.booking_id ?? 1),
          status: d.status || 'signed',
          is_finalized: d.is_finalized ?? true,
          contract_hash: d.contract_hash || '',
          created_at: d.created_at || new Date().toISOString(),
          signed_at: d.signed_at || new Date().toISOString(),
          renter_signature: d.renter_signature || undefined,
          owner_signature: d.owner_signature || undefined,
          snapshot: d.snapshot || {},
          parties: d.parties || contract?.parties || [],
          terms: Array.isArray(d.terms)
            ? d.terms.map((t: Record<string, string>) => typeof t === 'string' ? t : t.text || '').join('\n')
            : (d.terms || contract?.terms || ''),
        };
        setContract(mapped);
        toast.success('تم توقيع العقد بنجاح!');
        setTimeout(() => router.push('/dashboard/bookings'), 2000);
      } else {
        throw new Error('فشل توقيع العقد');
      }
    } catch {
      toast.error('فشل توقيع العقد. يرجى المحاولة مرة أخرى.');
      throw new Error('فشل توقيع العقد');
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">خطأ في النظام</h1>
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
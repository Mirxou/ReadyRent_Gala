'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CancellationPolicy } from '@/components/cancellation-policy';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, XCircle } from 'lucide-react';

export default function CancelBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policy, setPolicy] = useState<any>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadPolicy();
  }, [params.id]);

  const loadPolicy = async () => {
    try {
      const response = await api.get(`/bookings/${params.id}/cancellation-policy/`);
      setPolicy(response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحميل سياسة الإلغاء',
        variant: 'destructive',
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!policy?.can_cancel) {
      toast({
        title: 'خطأ',
        description: 'لا يمكن إلغاء هذا الحجز',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/bookings/${params.id}/cancel/`, { reason });
      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء الحجز بنجاح. سيتم استرجاع المبلغ خلال 3 أيام',
      });
      router.push('/dashboard/bookings');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل إلغاء الحجز',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (policyLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">إلغاء الحجز</h1>
        <p className="text-muted-foreground">تأكد من قراءة سياسة الإلغاء قبل المتابعة</p>
      </div>

      {policy && (
        <CancellationPolicy
          feeInfo={policy.fee_info}
          canCancel={policy.can_cancel}
          message={policy.message}
        />
      )}

      {policy?.can_cancel && (
        <Card>
          <CardHeader>
            <CardTitle>سبب الإلغاء (اختياري)</CardTitle>
            <CardDescription>ساعدنا في تحسين الخدمة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason">السبب</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="أخبرنا عن سبب الإلغاء..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCancel} disabled={loading} variant="destructive">
                {loading ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!policy?.can_cancel && (
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <p className="text-lg font-medium mb-2">لا يمكن إلغاء هذا الحجز</p>
            <p className="text-muted-foreground">{policy?.message}</p>
            <Button onClick={() => router.back()} className="mt-4">
              العودة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



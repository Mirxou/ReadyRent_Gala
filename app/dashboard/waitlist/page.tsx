'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { bookingsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { SovereignResponse } from '@/types/sovereign';

// WL-BUG-7 FIX: proper type instead of Record<string,unknown>
interface WaitlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  price_per_day: number;
  preferred_start: string | null;
  status: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    primary_image: string | null;
    price_per_day: number;
  } | null;
}

export default function WaitlistPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // WL-BUG-3 FIX: detect sovereignClient failure (data:null) properly
  const { data: waitlist, isLoading, isError } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const res = await bookingsApi.getWaitlist();
      // sovereignClient returns {data:null} on failure
      if (!res || res.status === 'sovereign_halt' || res.data == null) {
        throw new Error('waitlist-fetch-failed');
      }
      return res.data as WaitlistItem[];
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // WL-BUG-1 FIX: detect sovereignClient success/failure correctly
  // sovereignClient ALWAYS sets dignity_preserved=true — cannot use it for error detection
  // Instead check: success field from API, or status field from sovereignClient
  const removeFromWaitlistMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.removeFromWaitlist(id),
    onSuccess: (res: SovereignResponse<unknown>) => {
      // sovereignClient wraps API response. On success, API returns {success:true, data:{deleted:true}}
      // On network failure, sovereignClient returns {status:'sovereign_halt', data:null}
      if (res.status === 'sovereign_halt' || res.data == null) {
        toast.error(res.message_ar || 'حدث خطأ في الاتصال');
        return;
      }
      // Check if the API itself returned an error (e.g. 404, 403)
      const apiData = res.data as Record<string, unknown> | null;
      if (apiData && 'success' in apiData && apiData.success === false) {
        toast.error((apiData.message_ar as string) || 'حدث خطأ');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('تم إزالة المنتج من لائحة الانتظار');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل لائحة الانتظار...</p>
        </div>
      </div>
    );
  }

  if (isError || !waitlist || waitlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">لائحة الانتظار</h1>
        </div>
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">
            {isError ? 'خطأ في تحميل اللائحة' : 'لائحة الانتظار فارغة'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isError ? 'تعذر الاتصال بالخادم. حاول مرة أخرى.' : 'لم تقم بإضافة أي منتجات إلى لائحة الانتظار'}
          </p>
          <Button asChild>
            <Link href="/products">تصفح المنتجات</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">لائحة الانتظار</h1>
        <p className="text-muted-foreground">
          {waitlist.length} {waitlist.length === 1 ? 'منتج' : 'منتجات'} في لائحة الانتظار
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waitlist.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                {/* WL-BUG-4 FIX: API returns 'name' not 'name_ar' */}
                <CardTitle className="text-lg">{item.product?.name || item.product_name}</CardTitle>
                {item.status === 'notified' && (
                  <Badge variant="default">تم الإشعار</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {item.preferred_start && (
                <p className="text-sm text-muted-foreground mb-2">
                  تاريخ مفضل: {new Date(item.preferred_start).toLocaleDateString('ar-EG')}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/products/${item.product?.slug || item.product_id}`}>
                    عرض المنتج
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromWaitlistMutation.mutate(item.id)}
                  disabled={removeFromWaitlistMutation.isPending}
                  title="إزالة من لائحة الانتظار"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

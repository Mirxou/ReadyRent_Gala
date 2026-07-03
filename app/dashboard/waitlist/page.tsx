'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function WaitlistPage() {
  const queryClient = useQueryClient();

  const { data: waitlist, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => bookingsApi.getWaitlist().then((res) => res.data),
  });

  const removeFromWaitlistMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.removeFromWaitlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('تم إزالة المنتج من لائحة الانتظار');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ');
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

  if (!waitlist || waitlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">لائحة الانتظار</h1>
        </div>
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">لائحة الانتظار فارغة</h2>
          <p className="text-muted-foreground mb-6">
            لم تقم بإضافة أي منتجات إلى لائحة الانتظار
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
        {waitlist.map((item: any) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{item.product?.name_ar || item.product?.name}</CardTitle>
                {item.notified && (
                  <Badge variant="default">تم الإشعار</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {item.preferred_start_date && (
                <p className="text-sm text-muted-foreground mb-2">
                  تاريخ مفضل: {new Date(item.preferred_start_date).toLocaleDateString('ar-EG')}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/products/${item.product?.slug || item.product?.id}`}>
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


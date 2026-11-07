'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import type { ModerationReview } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  MessageSquareQuote,
} from 'lucide-react';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';

// ═══════════════════════════════════════════════════════════════
// /admin/reviews — Review moderation queue (MASTERPLAN 2.2)
// Reviews are created as 'pending'; this page closes the loop:
// approve → shows on the product page, reject → stays hidden.
// Uses GET /api/reviews/moderation + PATCH /api/reviews/[id]/moderate
// ═══════════════════════════════════════════════════════════════

const STATUS_TABS = [
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'approved', label: 'منشورة' },
  { key: 'rejected', label: 'مرفوضة' },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]['key'];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`تقييم ${rating} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [statusTab, setStatusTab] = useState<StatusKey>('pending');
  const [page, setPage] = useState(1);

  const authorized = isAuthenticated && (user?.role === 'admin' || user?.role === 'staff');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const listQuery = useQuery({
    queryKey: ['admin-reviews-moderation', statusTab, page],
    queryFn: () => reviewsApi.listModeration({ status: statusTab, page, limit: 10 }),
    enabled: authorized,
  });

  // Light count queries for the tab badges (limit=1 → only totals matter)
  const pendingCount = useQuery({
    queryKey: ['admin-reviews-moderation-count', 'pending'],
    queryFn: () => reviewsApi.listModeration({ status: 'pending', page: 1, limit: 1 }),
    enabled: authorized,
  });
  const approvedCount = useQuery({
    queryKey: ['admin-reviews-moderation-count', 'approved'],
    queryFn: () => reviewsApi.listModeration({ status: 'approved', page: 1, limit: 1 }),
    enabled: authorized,
  });
  const rejectedCount = useQuery({
    queryKey: ['admin-reviews-moderation-count', 'rejected'],
    queryFn: () => reviewsApi.listModeration({ status: 'rejected', page: 1, limit: 1 }),
    enabled: authorized,
  });

  const countByStatus = (status: StatusKey) => {
    const map: Record<StatusKey, typeof pendingCount> = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    };
    return map[status].data?.pagination?.total ?? null;
  };

  const moderateMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) =>
      reviewsApi.moderate(id, decision),
    onSuccess: (res, vars) => {
      if (res.success === false || (res.httpStatus && res.httpStatus >= 400)) {
        toast.error(res.message_ar || 'فشل تحديث حالة التقييم');
        return;
      }
      toast.success(
        vars.decision === 'approved'
          ? 'تم نشر التقييم — أصبح ظاهراً على صفحة المنتج'
          : 'تم رفض التقييم — سيبقى مخفياً عن الزوار'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-moderation-count'] });
    },
    onError: () => toast.error('خطأ في الاتصال — أعد المحاولة'),
  });

  if (!authorized) return null;

  const reviews: ModerationReview[] = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const isPending = moderateMutation.isPending;
  const pendingId = moderateMutation.variables?.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <MessageSquareQuote className="h-7 w-7 text-sovereign-gold" />
          إدارة التقييمات
        </h1>
        <p className="text-muted-foreground">
          مراجعة تقييمات العملاء والقرار بنشرها — التقييمات المعلّقة لا تظهر للزوار حتى الموافقة
        </p>
      </div>

      {/* Status tabs with counts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => {
          const count = countByStatus(tab.key);
          const active = statusTab === tab.key;
          return (
            <Button
              key={tab.key}
              variant={active ? 'default' : 'outline'}
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => {
                setStatusTab(tab.key);
                setPage(1);
              }}
            >
              {tab.key === 'pending' && <Clock className="h-4 w-4" />}
              {tab.key === 'approved' && <CheckCircle2 className="h-4 w-4" />}
              {tab.key === 'rejected' && <XCircle className="h-4 w-4" />}
              {tab.label}
              {count !== null && (
                <Badge variant={active ? 'secondary' : 'outline'} className="rounded-full">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* List */}
      {listQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <DignifiedLoader />
        </div>
      ) : listQuery.data && listQuery.data.success === false ? (
        <Card className="border-red-500/20">
          <CardContent className="py-10 text-center text-red-500">
            {listQuery.data.message_ar || 'تعذر جلب التقييمات'}
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareQuote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {statusTab === 'pending'
                ? 'لا توجد تقييمات تنتظر المراجعة — كل شيء تحت السيطرة'
                : 'لا توجد تقييمات في هذه الحالة'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const productName = review.product?.name_ar || review.product?.name || 'منتج';
            const reviewer = review.reviewer_name || review.user?.username || 'مستخدم';
            return (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full text-xs">
                          {productName}
                        </Badge>
                        {review.is_verified && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            شراء موثّق
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reviewer} · {formatDate(review.created_at)}
                      </div>
                    </div>
                    <Stars rating={review.rating} />
                  </div>

                  {review.comment && (
                    <p className="text-sm leading-relaxed bg-muted/40 rounded-xl p-3">
                      {review.comment}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 justify-end">
                    {review.status !== 'approved' && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={isPending}
                        onClick={() =>
                          moderateMutation.mutate({ id: review.id, decision: 'approved' })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        نشر
                      </Button>
                    )}
                    {review.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10"
                        disabled={isPending}
                        onClick={() =>
                          moderateMutation.mutate({ id: review.id, decision: 'rejected' })
                        }
                      >
                        <XCircle className="h-4 w-4" />
                        رفض
                      </Button>
                    )}
                    {isPending && pendingId === review.id && (
                      <span className="text-xs text-muted-foreground self-center">
                        جاري التحديث...
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {pagination?.page ?? page} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlarmClockOff,
  Banknote,
  CalendarRange,
  CreditCard,
  HandCoins,
  Info,
  Loader2,
  Mail,
  PackageOpen,
  Shield,
  Star,
  Timer,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PriceBreakdown } from "@/components/rental/price-breakdown";
import {
  ErrorState,
  ItemImage,
  RowsSkeleton,
  Stars,
  StatusBadge,
} from "@/components/rental/primitives";
import { ReviewForm } from "@/components/rental/review-form";
import { getJson, postAction, postJson } from "@/components/rental/api";
import { MS_PER_DAY, formatDZD } from "@/lib/escrow";
import type { BookingDTO, BookingResponse, BookingsResponse } from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function remainingLabel(endISO: string): string {
  const ms = new Date(endISO).getTime() - Date.now();
  if (ms <= 0) return "انتهت مدة الكراء — جارٍ تحديث حالة الحجز";
  const days = Math.floor(ms / MS_PER_DAY);
  const hours = Math.floor((ms % MS_PER_DAY) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days >= 1)
    return `متبقٍ ${days} يوم${hours ? ` و${hours} ساعة` : ""} على موعد الإرجاع`;
  if (hours >= 1)
    return `متبقٍ ${hours} ساعة و${mins} دقيقة على موعد الإرجاع`;
  return `متبقٍ ${mins} دقيقة فقط على موعد الإرجاع — أسرع!`;
}

export function MyBookingsTab({ customerId }: { customerId?: string }) {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["bookings", "customer", customerId ?? ""],
    queryFn: () =>
      getJson<BookingsResponse>(
        `/api/bookings?customerId=${encodeURIComponent(customerId!)}`
      ),
    enabled: !!customerId,
    refetchInterval: 5000,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["emails"] });
    queryClient.invalidateQueries({ queryKey: ["items"] });
  }

  if (!customerId || bookingsQuery.isPending) {
    return <RowsSkeleton count={3} height="h-44" />;
  }
  if (bookingsQuery.isError) {
    return <ErrorState onRetry={() => bookingsQuery.refetch()} />;
  }

  const bookings = [...(bookingsQuery.data?.bookings ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
        <PackageOpen className="size-9 text-muted-foreground/60" />
        <p className="font-medium">لا حجوزات بعد — غرفة عملياتك فارغة</p>
        <p className="max-w-md text-sm text-muted-foreground">
          تصفّح المعدات وابدأ أول كراء. ستظهر هنا كل عملياتك: الدفع، العدّ
          التنازلي للإرجاع، رسوم التأخير، واسترجاع الضمان.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} onChanged={refresh} />
      ))}
    </div>
  );
}

// ─── Single booking card (tenant operations room) ────────────────────
function BookingCard({
  booking: b,
  onChanged,
}: {
  booking: BookingDTO;
  onChanged: () => void;
}) {
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState<null | "pay" | "overdue">(null);

  async function pay() {
    setBusy("pay");
    try {
      await postJson<BookingResponse>("/api/payments/webhook", {
        bookingId: b.id,
      });
      toast.success("تم الدفع ✅ أُرسل الإيصال إلى بريدك وأُشعر التاجر");
      setPayOpen(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الدفع");
    } finally {
      setBusy(null);
    }
  }

  async function simulateOverdue() {
    setBusy("overdue");
    try {
      await postAction<BookingResponse>(
        `/api/bookings/${b.id}/simulate-overdue`
      );
      toast.info("أصبح الحجز متأخراً (عرض) — راقب الإنذار وصندوق الصادر");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشلت المحاكاة");
    } finally {
      setBusy(null);
    }
  }

  const refundValue =
    b.status === "COMPLETED"
      ? formatDZD(b.depositReturned)
      : b.status === "PENDING_PAYMENT"
        ? "يُحدَّد بعد الدفع"
        : formatDZD(b.projectedRefund);

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border-border p-0 shadow-sm">
      <div className="space-y-4 p-4 sm:p-5">
        {/* header */}
        <div className="flex items-center gap-3">
          <ItemImage
            src={b.item.imageUrl}
            alt={b.item.name}
            className="size-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{b.item.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {b.item.category} — {b.item.merchant.name}
            </p>
          </div>
          <StatusBadge status={b.status} className="shrink-0" />
        </div>

        {/* money / dates grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <InfoRow
            label="التواريخ"
            value={
              <span className="flex items-center gap-1.5">
                <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" />
                {fmtDate(b.startDate)} ← {fmtDate(b.endDate)}
              </span>
            }
            hint={`${b.days} ${b.days === 1 ? "يوم" : "أيام"}`}
          />
          <InfoRow
            label="الإجمالي المدفوع"
            value={
              <span className="flex items-center gap-1.5">
                <Banknote className="size-3.5 shrink-0 text-muted-foreground" />
                {formatDZD(b.totalPrice)}
              </span>
            }
          />
          <InfoRow
            label="الضمان المحتجز"
            value={
              <span className="flex items-center gap-1.5 text-amber-700">
                <Shield className="size-3.5 shrink-0" />
                {b.status === "PENDING_PAYMENT"
                  ? `${formatDZD(b.deposit)} (عند الدفع)`
                  : formatDZD(b.depositHeld)}
              </span>
            }
          />
          <InfoRow
            label="رسوم التأخير"
            value={
              b.lateFee > 0 ? (
                <span className="font-semibold text-red-600">
                  + {formatDZD(b.lateFee)}
                </span>
              ) : (
                <span className="text-emerald-700">لا شيء</span>
              )
            }
          />
          <InfoRow
            label="المُسترجع المتوقع / الفعلي"
            value={
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <HandCoins className="size-3.5 shrink-0" />
                {refundValue}
              </span>
            }
          />
        </div>

        {/* status-specific action zone */}
        <Separator />

        {b.status === "PENDING_PAYMENT" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              أكمل الدفع ليُحتجز الضمان في الحساب الوسيط ويصلك إيصال بالبريد.
            </p>
            <Button
              onClick={() => setPayOpen(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CreditCard className="size-4" />
              الدفع الآن
            </Button>
          </div>
        )}

        {b.status === "CONFIRMED" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
              <Timer className="size-4" />
              {remainingLabel(b.endDate)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={simulateOverdue}
              disabled={busy === "overdue"}
              className="text-muted-foreground hover:text-amber-700"
            >
              {busy === "overdue" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              محاكاة تجاوز الموعد (عرض)
            </Button>
          </div>
        )}

        {b.status === "OVERDUE" && (
          <div className="space-y-2">
            <Alert className="border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600">
              <AlarmClockOff className="size-4" />
              <AlertTitle>تجاوزت موعد الإرجاع</AlertTitle>
              <AlertDescription className="text-red-800">
                رسوم {formatDZD(b.lateFee)} تُقتطع من الضمان. صلك إنذار بالبريد —
                أعد المعدة ليتوقف احتساب الرسوم ويُفك حجز الضمان.
              </AlertDescription>
            </Alert>
            {b.lateWarningSent && (
              <Badge
                variant="outline"
                className="border-red-200 bg-red-50 text-red-800"
              >
                <Mail className="size-3" />
                أُرسل الإنذار
              </Badge>
            )}
          </div>
        )}

        {b.status === "COMPLETED" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <HandCoins className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>
                فُك الحجز عن ضمانك: استرجعت{" "}
                <b className="text-emerald-700">
                  {formatDZD(b.depositReturned)}
                </b>
              </span>
            </div>

            {b.review ? (
              <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  تقييمك لهذا الكراء
                </p>
                <Stars value={b.review.rating} />
                {b.review.comment && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    «{b.review.comment}»
                  </p>
                )}
              </div>
            ) : (
              <ReviewForm
                bookingId={b.id}
                customerId={b.customerId}
                onSubmitted={onChanged}
              />
            )}
          </div>
        )}
      </div>

      {/* payment dialog — same transparent breakdown */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto scrollbar-thin sm:max-w-md">
          <DialogHeader className="text-start">
            <DialogTitle>الدفع — {b.item.name}</DialogTitle>
            <DialogDescription>
              راجع التفصيل الشفاف قبل تأكيد الدفع
            </DialogDescription>
          </DialogHeader>

          <PriceBreakdown
            days={b.days}
            dailyRate={b.item.dailyRate}
            deposit={b.deposit}
            insuranceFee={b.insuranceFee}
          />

          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <Info className="mt-0.5 size-4 shrink-0" />
            الدفع محاكاة لبوابة الدفع — سيصلك إيصال بالبريد ويُشعر التاجر بطلبك.
          </p>

          <DialogFooter>
            <Button
              onClick={pay}
              disabled={busy === "pay"}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {busy === "pay" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              تأكيد الدفع — {formatDZD(b.totalPrice)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-1 font-medium">
        {value}
        {hint && (
          <span className="text-[11px] font-normal text-muted-foreground">
            ({hint})
          </span>
        )}
      </p>
    </div>
  );
}

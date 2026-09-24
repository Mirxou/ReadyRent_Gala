"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceBreakdown } from "@/components/rental/price-breakdown";
import { ItemImage } from "@/components/rental/primitives";
import { postJson } from "@/components/rental/api";
import { countDays, computeQuote, formatDZD } from "@/lib/escrow";
import type { BookingResponse, ItemDTO } from "@/lib/types";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDay(iso: string): Date {
  // midday keeps the day stable across timezones / DST
  return new Date(`${iso}T12:00:00`);
}

export function BookingDialog({
  item,
  customerId,
  open,
  onOpenChange,
  onBooked,
}: {
  item: ItemDTO | null;
  customerId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked: () => void;
}) {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const [startDate, setStartDate] = useState(toISODate(tomorrow));
  const [endDate, setEndDate] = useState(
    toISODate(new Date(tomorrow.getTime() + 2 * 24 * 3600 * 1000))
  );
  const [submitting, setSubmitting] = useState(false);

  const days =
    startDate && endDate
      ? countDays(parseDay(startDate), parseDay(endDate))
      : 1;
  const minStart = toISODate(tomorrow);
  const minEnd = startDate
    ? toISODate(new Date(parseDay(startDate).getTime() + 24 * 3600 * 1000))
    : minStart;
  const quote = item
    ? computeQuote({
        dailyRate: item.dailyRate,
        days,
        deposit: item.deposit,
        insuranceFee: item.insuranceFee,
      })
    : null;

  async function confirm() {
    if (!item || !customerId) return;
    setSubmitting(true);
    try {
      await postJson<BookingResponse>("/api/bookings", {
        itemId: item.id,
        customerId,
        startDate: parseDay(startDate).toISOString(),
        endDate: parseDay(endDate).toISOString(),
      });
      toast.success("تم إنشاء الحجز! أكمل الدفع من تبويب حجوزاتي");
      onOpenChange(false);
      onBooked();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر إنشاء الحجز");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>حجز المعدة</DialogTitle>
          <DialogDescription>
            راجع التفاصيل والسعر الشفاف قبل التأكيد
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <ItemImage
            src={item.imageUrl}
            alt={item.name}
            className="h-40 w-full rounded-xl object-cover"
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">{item.name}</h3>
              <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-800">
                {item.category}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="size-3.5" />
              {item.merchant.name}
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="booking-start" className="text-xs">
                تاريخ البداية
              </Label>
              <Input
                id="booking-start"
                type="date"
                dir="ltr"
                value={startDate}
                min={minStart}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartDate(v);
                  if (v && endDate && endDate <= v) {
                    setEndDate(
                      toISODate(new Date(parseDay(v).getTime() + 24 * 3600 * 1000))
                    );
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booking-end" className="text-xs">
                تاريخ النهاية
              </Label>
              <Input
                id="booking-end"
                type="date"
                dir="ltr"
                value={endDate}
                min={minEnd}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            مدة الكراء: {days} {days === 1 ? "يوم" : "أيام"} — الحد الأدنى يوم
            واحد
          </p>

          <PriceBreakdown
            days={days}
            dailyRate={item.dailyRate}
            deposit={item.deposit}
            insuranceFee={item.insuranceFee}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {customerId ? (
            <Button
              onClick={confirm}
              disabled={submitting}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              تأكيد الحجز — {quote ? formatDZD(quote.totalPrice) : ""}
            </Button>
          ) : (
            <Button disabled className="w-full">
              جارٍ تحميل هوية الزبون…
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

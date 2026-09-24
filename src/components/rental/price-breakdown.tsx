"use client";

import { Banknote, HandCoins, ShieldCheck, Umbrella } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { computeQuote, formatDZD } from "@/lib/escrow";
import { cn } from "@/lib/utils";

/**
 * P1 transparency showcase: live, client-side price breakdown
 * كراء (rental) + ضمان (escrow deposit) + تأمين (insurance) = الإجمالي.
 */
export function PriceBreakdown({
  days,
  dailyRate,
  deposit,
  insuranceFee,
  className,
}: {
  days: number;
  dailyRate: number;
  deposit: number;
  insuranceFee: number;
  className?: string;
}) {
  const quote = computeQuote({ dailyRate, days, deposit, insuranceFee });
  const dayWord =
    days === 1 ? "يوم" : days === 2 ? "يومان" : days <= 10 ? "أيام" : "يوم";

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4",
        className
      )}
    >
      <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
        <HandCoins className="size-4 text-emerald-600" />
        تفصيل السعر — بشفافية كاملة
      </p>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Banknote className="size-4" />
            كراء ({days} {dayWord} × {formatDZD(dailyRate)})
          </span>
          <span className="font-medium">{formatDZD(quote.rentalPrice)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="size-4 text-amber-600" />
            الضمان (يُحتجز ويُعاد بعد الإرجاع)
          </span>
          {quote.deposit > 0 ? (
            <span className="font-medium text-amber-700">
              {formatDZD(quote.deposit)}
            </span>
          ) : (
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">
              بدون ضمان
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Umbrella className="size-4 text-teal-600" />
            التأمين
          </span>
          <span className="font-medium">{formatDZD(quote.insuranceFee)}</span>
        </div>
      </div>

      <Separator className="bg-emerald-200/70" />

      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">الإجمالي المطلوب اليوم</span>
        <span className="text-xl font-extrabold text-emerald-700">
          {formatDZD(quote.totalPrice)}
        </span>
      </div>
    </div>
  );
}

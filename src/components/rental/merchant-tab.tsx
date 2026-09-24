"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlarmClockOff,
  Banknote,
  CircleCheckBig,
  Inbox,
  KeyRound,
  Loader2,
  PackageCheck,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  EmptyState,
  ErrorState,
  ItemImage,
  RowsSkeleton,
  StatsSkeleton,
  StatusBadge,
} from "@/components/rental/primitives";
import { getJson, postAction } from "@/components/rental/api";
import { formatDZD } from "@/lib/escrow";
import type {
  BookingDTO,
  BookingResponse,
  BookingsResponse,
  MerchantsResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-DZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MerchantTab() {
  const queryClient = useQueryClient();
  const merchantsQuery = useQuery({
    queryKey: ["merchants"],
    queryFn: () => getJson<MerchantsResponse>("/api/merchants"),
  });
  const merchants = merchantsQuery.data?.merchants ?? [];

  const [picked, setPicked] = useState("");
  const activeId = picked || merchants[0]?.id || "";

  const bookingsQuery = useQuery({
    queryKey: ["bookings", "merchant", activeId],
    queryFn: () =>
      getJson<BookingsResponse>(
        `/api/bookings?merchantId=${encodeURIComponent(activeId)}`
      ),
    enabled: !!activeId,
    refetchInterval: 5000,
  });

  const [returningId, setReturningId] = useState<string | null>(null);

  const bookings = useMemo(
    () =>
      [...(bookingsQuery.data?.bookings ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [bookingsQuery.data]
  );

  const stats = useMemo(() => {
    const c = { pending: 0, active: 0, overdue: 0, completed: 0, revenue: 0 };
    for (const b of bookings) {
      if (b.status === "PENDING_PAYMENT") c.pending++;
      else if (b.status === "CONFIRMED") {
        c.active++;
        c.revenue += b.rentalPrice;
      } else if (b.status === "OVERDUE") c.overdue++;
      else if (b.status === "COMPLETED") {
        c.completed++;
        c.revenue += b.rentalPrice;
      }
    }
    return c;
  }, [bookings]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["emails"] });
  }

  async function confirmReturn(id: string) {
    setReturningId(id);
    try {
      const data = await postAction<BookingResponse>(
        `/api/bookings/${id}/return`
      );
      toast.success(
        `تم إرجاع ${formatDZD(data.booking.projectedRefund)} للزبون وفك حجز الضمان`
      );
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تأكيد الاستلام");
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* header + merchant picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Store className="size-5 text-emerald-600" />
            لوحة التاجر
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            تابع الطلبات، أكّد استلام المعدات، وفكّ حجز الضمان للزبون.
          </p>
        </div>
        {merchantsQuery.isPending ? (
          <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
        ) : (
          <Select dir="rtl" value={activeId} onValueChange={setPicked}>
            <SelectTrigger className="w-52 bg-card">
              <SelectValue placeholder="اختر التاجر" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {merchants.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {merchantsQuery.isPending ? (
        <StatsSkeleton />
      ) : bookingsQuery.isPending ? (
        <StatsSkeleton />
      ) : bookingsQuery.isError ? (
        <ErrorState onRetry={() => bookingsQuery.refetch()} />
      ) : (
        <>
          {/* stats row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Inbox}
              tone="amber"
              label="طلبات جديدة"
              value={stats.pending}
            />
            <StatCard
              icon={KeyRound}
              tone="emerald"
              label="قيد الاستئجار"
              value={stats.active}
            />
            <StatCard
              icon={AlarmClockOff}
              tone="red"
              label="متأخرة"
              value={stats.overdue}
            />
            <StatCard
              icon={CircleCheckBig}
              tone="slate"
              label="مكتملة"
              value={stats.completed}
            />
          </div>

          {/* revenue strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-gradient-to-l from-emerald-50 to-teal-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
              <Banknote className="size-4 text-emerald-600" />
              إيرادات الكراء المحققة (مكتملة + قيد الاستئجار)
            </p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {formatDZD(stats.revenue)}
            </p>
          </div>

          {/* orders list */}
          <Card className="gap-0 rounded-xl border-border py-0 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border p-4">
              <h3 className="font-semibold">الطلبات</h3>
              <Badge variant="secondary">{bookings.length} طلب</Badge>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin p-4">
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="لا طلبات لهذا التاجر بعد"
                  hint="عندما يدفع زبون سيظهر طلبه هنا فوراً."
                />
              ) : (
                bookings.map((b) => (
                  <OrderRow
                    key={b.id}
                    booking={b}
                    returning={returningId === b.id}
                    onConfirmReturn={() => confirmReturn(b.id)}
                  />
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red" | "slate";
}) {
  const tones = {
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    red: "border-red-100 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  } as const;
  const t = tones[tone];
  return (
    <div className={cn("rounded-xl border p-4", t)}>
      <div className="flex items-center gap-2 text-xs font-medium opacity-90">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

// ─── Single order row ────────────────────────────────────────────────
function OrderRow({
  booking: b,
  returning,
  onConfirmReturn,
}: {
  booking: BookingDTO;
  returning: boolean;
  onConfirmReturn: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ItemImage
            src={b.item.imageUrl}
            alt={b.item.name}
            className="size-10 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
              {b.customerName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {b.item.name} — {fmtDate(b.startDate)} ← {fmtDate(b.endDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 lg:shrink-0">
          <span className="text-sm font-bold text-emerald-700">
            {formatDZD(b.totalPrice)}
          </span>
          {b.lateFee > 0 && (
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700"
            >
              تأخير + {formatDZD(b.lateFee)}
            </Badge>
          )}
          <StatusBadge status={b.status} />
          {b.status === "PENDING_PAYMENT" && (
            <span className="text-xs text-muted-foreground">
              بانتظار دفع الزبون
            </span>
          )}
          {(b.status === "CONFIRMED" || b.status === "OVERDUE") && (
            <Button
              size="sm"
              onClick={onConfirmReturn}
              disabled={returning}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {returning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PackageCheck className="size-4" />
              )}
              تأكيد الاستلام وفك الضمان
            </Button>
          )}
          {b.status === "COMPLETED" && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CircleCheckBig className="size-3.5" />
              تمت التسوية
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

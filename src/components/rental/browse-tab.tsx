"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Sparkles } from "lucide-react";
import { BookingDialog } from "@/components/rental/booking-dialog";
import { getJson } from "@/components/rental/api";
import { ItemCard } from "@/components/rental/item-card";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  FadeIn,
} from "@/components/rental/primitives";
import type { ItemDTO, ItemsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BrowseTab({
  customerId,
  onBooked,
}: {
  customerId?: string;
  onBooked: () => void;
}) {
  const itemsQuery = useQuery({
    queryKey: ["items"],
    queryFn: () => getJson<ItemsResponse>("/api/items"),
  });

  const [category, setCategory] = useState("الكل");
  const [selected, setSelected] = useState<ItemDTO | null>(null);

  const items = itemsQuery.data?.items ?? [];
  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );
  const filtered =
    category === "الكل" ? items : items.filter((i) => i.category === category);

  return (
    <div className="space-y-6">
      {/* Hero strip — escrow transparency pitch */}
      <FadeIn className="rounded-2xl border border-emerald-100 bg-gradient-to-l from-emerald-50 via-teal-50/70 to-amber-50 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-emerald-950 sm:text-2xl">
          <Sparkles className="size-5 text-amber-500" />
          كرّئ المعدات التي تحتاجها — بدون مخاطرة
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-900/80">
          السعر الذي تدفعه اليوم = الكراء + ضمان يُحتجز بشفافية في حساب وسيط
          ويُعاد لك بعد الإرجاع + تأمين بسيط. ترى كل جزء من أموالك قبل الدفع،
          وتصلك إشعارات بكل خطوة: الإيصال، طلب التاجر، وفك حجز الضمان.
        </p>
      </FadeIn>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {itemsQuery.isPending ? (
        <CardsSkeleton />
      ) : itemsQuery.isError ? (
        <ErrorState onRetry={() => itemsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="لا توجد معدات في هذه الفئة"
          hint="جرّب فئة أخرى — كل المعدات معروضة بأسعار شفافة مع تفصيل الضمان."
        />
      ) : (
        <FadeIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onOpen={setSelected} />
          ))}
        </FadeIn>
      )}

      {selected && (
        <BookingDialog
          key={selected.id}
          item={selected}
          customerId={customerId}
          open={!!selected}
          onOpenChange={(o) => {
            if (!o) setSelected(null);
          }}
          onBooked={onBooked}
        />
      )}
    </div>
  );
}

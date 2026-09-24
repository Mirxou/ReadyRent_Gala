"use client";

import { BadgeCheck, Shield, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ItemImage, Stars } from "@/components/rental/primitives";
import { formatDZD } from "@/lib/escrow";
import type { ItemDTO } from "@/lib/types";

export function ItemCard({
  item,
  onOpen,
}: {
  item: ItemDTO;
  onOpen: (item: ItemDTO) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="relative overflow-hidden">
        <ItemImage
          src={item.imageUrl}
          alt={item.name}
          className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <Badge className="absolute top-3 start-3 border-emerald-200 bg-white/90 text-emerald-800 backdrop-blur">
          {item.category}
        </Badge>
      </div>

      <div className="space-y-2.5 p-4">
        <h3 className="font-semibold leading-snug">{item.name}</h3>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Store className="size-3.5" />
          {item.merchant.name}
        </p>

        <div className="flex items-center gap-1.5 text-xs">
          <Stars value={item.ratingAvg ?? 0} />
          <span className="font-medium">
            {item.ratingAvg != null ? item.ratingAvg.toFixed(1) : "جديد"}
          </span>
          <span className="text-muted-foreground">
            ({item.reviewsCount} {item.reviewsCount === 1 ? "تقييم" : "تقييمات"})
          </span>
        </div>

        <Separator />

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="leading-tight">
            <span className="text-xl font-extrabold text-emerald-700">
              {formatDZD(item.dailyRate)}
            </span>
            <span className="text-xs text-muted-foreground"> /اليوم</span>
          </div>

          {item.hasDeposit ? (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-800"
            >
              <Shield className="size-3" />
              ضمان {formatDZD(item.deposit)} يُعاد
            </Badge>
          ) : (
            <Badge className="border-transparent bg-emerald-100 text-emerald-800">
              <BadgeCheck className="size-3" />
              بدون ضمان
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

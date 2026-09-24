"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Inbox,
  PackageOpen,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Status badge (emerald/amber/red/slate — no blue) ────────────────
export const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  OVERDUE: "border-red-200 bg-red-50 text-red-800",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_BADGE_CLASS[status] ?? "", className)}
    >
      {BOOKING_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

// ─── Stars (display only) ────────────────────────────────────────────
export function Stars({
  value,
  starClass = "size-3.5",
  className,
}: {
  value: number;
  starClass?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      dir="ltr"
      role="img"
      aria-label={`${value} من 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            starClass,
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

// ─── Item image with graceful fallback ───────────────────────────────
export function ItemImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-bl from-emerald-100 via-teal-50 to-amber-50 text-emerald-700",
          className
        )}
      >
        <PackageOpen className="size-8 opacity-60" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

// ─── Motion fade-in wrapper ──────────────────────────────────────────
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Error / empty states ────────────────────────────────────────────
export function ErrorState({
  onRetry,
  title = "تعذّر تحميل البيانات",
}: {
  onRetry: () => void;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50/60 p-8 text-center">
      <AlertTriangle className="size-8 text-red-500" />
      <p className="font-medium text-red-900">{title}</p>
      <Button
        size="sm"
        onClick={onRetry}
        className="bg-red-600 text-white hover:bg-red-700"
      >
        إعادة المحاولة
      </Button>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <Icon className="size-9 text-muted-foreground/60" />
      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-md text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ─── Loading skeletons ───────────────────────────────────────────────
export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({
  count = 3,
  height = "h-36",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-xl", height)} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

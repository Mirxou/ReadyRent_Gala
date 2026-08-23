'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ActiveSubscriptionSkeleton() {
  return (
    <section className="py-10 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-12 w-64" />
        </div>
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-6 md:p-10 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlansSkeleton() {
  return (
    <section className="py-10 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-10 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HistorySkeleton() {
  return (
    <section className="py-10 md:py-16 px-4 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-12 w-56" />
        </div>
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-4 md:p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

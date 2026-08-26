'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Base skeleton ─────────────────────────────────────────────────────────────
function Pulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl bg-slate-200 dark:bg-slate-800', className)}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Dispute Card Skeleton ─────────────────────────────────────────────────────
export function DisputeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-5 w-48" />
        </div>
        <Pulse className="h-6 w-20 rounded-full" />
      </div>
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-3/4" />
      <div className="flex justify-between pt-2">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-3 w-20" />
      </div>
    </div>
  );
}

// ── Product Card Skeleton ─────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <Pulse className="h-52 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Pulse className="h-5 w-3/4" />
        <Pulse className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Pulse className="h-6 w-24" />
          <Pulse className="h-9 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Judicial Ledger Case Skeleton ─────────────────────────────────────────────
export function JudicialCaseSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-5 w-40" />
        </div>
        <Pulse className="h-6 w-16 rounded-full" />
      </div>
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-5/6" />
      <div className="flex justify-between pt-1">
        <Pulse className="h-3 w-28" />
        <Pulse className="h-3 w-16" />
      </div>
    </div>
  );
}

// ── Transaction Row Skeleton ──────────────────────────────────────────────────
export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Pulse className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Pulse className="h-4 w-40" />
        <Pulse className="h-3 w-24" />
      </div>
      <div className="text-right space-y-1.5">
        <Pulse className="h-4 w-20 ml-auto" />
        <Pulse className="h-3 w-14 ml-auto rounded-full" />
      </div>
    </div>
  );
}

// ── Wallet Balance Skeleton ───────────────────────────────────────────────────
export function WalletBalanceSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-6 bg-white dark:bg-slate-900">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Pulse className="h-3 w-20" />
          <Pulse className="h-10 w-48" />
        </div>
        <Pulse className="w-14 h-14 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Pulse className="h-20 rounded-2xl" />
        <Pulse className="h-20 rounded-2xl" />
      </div>
      <Pulse className="h-12 rounded-2xl" />
    </div>
  );
}

// ── Stat Cards Row Skeleton ───────────────────────────────────────────────────
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-4 w-4 rounded" />
          </div>
          <Pulse className="h-8 w-24" />
          <Pulse className="h-2 w-16" />
        </div>
      ))}
    </div>
  );
}

// ── Page Hero Skeleton ────────────────────────────────────────────────────────
export function PageHeroSkeleton() {
  return (
    <div className="py-20 px-6 text-center space-y-4">
      <Pulse className="h-16 w-16 rounded-full mx-auto" />
      <Pulse className="h-10 w-80 mx-auto" />
      <Pulse className="h-4 w-96 mx-auto" />
      <Pulse className="h-3 w-64 mx-auto" />
    </div>
  );
}

// ── Contract Timeline Skeleton ────────────────────────────────────────────────
export function ContractTimelineSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
      <Pulse className="h-5 w-36 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 pb-4">
          <div className="flex flex-col items-center">
            <Pulse className="w-9 h-9 rounded-full" />
            {i < 4 && <Pulse className="w-0.5 h-8 mt-1 rounded-none" />}
          </div>
          <div className="flex-1 space-y-1.5 pt-1">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

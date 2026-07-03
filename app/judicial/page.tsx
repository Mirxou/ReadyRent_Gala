'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Scale,
  BookOpen,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Gavel,
} from 'lucide-react';
import { disputesApi } from '@/lib/api/disputes';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const VERDICT_LABELS: Record<string, { label: string; color: string }> = {
  renter_wins: { label: 'فاز المستأجر', color: 'bg-green-100 text-green-700' },
  owner_wins: { label: 'فاز المؤجر', color: 'bg-blue-100 text-blue-700' },
  split: { label: 'حكم متقسم', color: 'bg-amber-100 text-amber-700' },
  dismissed: { label: 'رُفضت القضية', color: 'bg-gray-100 text-gray-600' },
};

export default function JudicialLedgerPage() {
  const [page, setPage] = useState(1);

  const { data: ledgerRes, isLoading, isError } = useQuery({
    queryKey: ['judicial-ledger', page],
    queryFn: () => disputesApi.getPublicLedger({ page, page_size: 10 }),
  });

  const ledger = ledgerRes?.data;
  const results: any[] = ledger?.results ?? [];
  const stats = ledger?.stats ?? {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-16">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950 mb-6">
            <Scale className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">
            السجل القضائي العام
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            سجل شفاف وغير قابل للتعديل لجميع الأحكام القضائية الصادرة عن منصة ReadyRent.
            جميع البيانات مجهولة الهوية للحفاظ على خصوصية الأطراف.
          </p>
        </motion.div>

        {/* Stats Row */}
        {!isLoading && Object.keys(stats).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            {[
              { label: 'إجمالي القضايا', value: stats.total ?? '—', icon: BookOpen, color: 'text-blue-600' },
              { label: 'تم حلها', value: stats.resolved ?? '—', icon: CheckCircle2, color: 'text-green-600' },
              { label: 'أحكام متقسمة', value: stats.split ?? '—', icon: BarChart3, color: 'text-amber-600' },
              { label: 'متوسط زمن الحل', value: stats.avg_days ? `${stats.avg_days} يوم` : '—', icon: Clock, color: 'text-purple-600' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Ledger entries */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p>تعذر تحميل السجل القضائي. تأكد من اتصالك بالخادم.</p>
            </div>
          )}

          {!isLoading && !isError && results.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
              <Shield className="w-12 h-12 text-slate-300" />
              <p>لا توجد أحكام منشورة بعد في السجل العام.</p>
            </div>
          )}

          {results.map((entry: any, i: number) => {
            const verdictInfo = VERDICT_LABELS[entry.verdict] ?? { label: entry.verdict, color: 'bg-gray-100 text-gray-600' };

            return (
              <motion.div
                key={entry.id ?? i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <Gavel className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">#{entry.case_ref ?? entry.id}</span>
                        <Badge className={`text-xs ${verdictInfo.color}`}>
                          {verdictInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                        {entry.summary_ar ?? entry.ruling_text ?? 'حكم قضائي نهائي'}
                      </p>
                      {entry.claimed_amount && (
                        <p className="text-xs text-slate-400 mt-2">
                          المبلغ المتنازع عليه: <span className="font-bold">{entry.claimed_amount} دج</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">
                      {entry.finalized_at
                        ? new Date(entry.finalized_at).toLocaleDateString('ar-DZ')
                        : '—'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {ledger?.count > 10 && (
          <div className="flex justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="px-4 py-2 text-sm text-slate-500">
              صفحة {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!ledger?.next}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}

        {/* Trust footer */}
        <div className="mt-12 flex flex-col items-center gap-2 text-slate-400 text-xs">
          <Shield className="w-5 h-5" />
          <p>جميع الأحكام مجهولة الهوية ومحمية بتقنية BLAKE2b Hash Chaining</p>
          <p>ReadyRent Sovereign Judicial System — نظام قضائي مستقل وشفاف</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { hygieneApi } from '@/lib/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HygieneBadgeProps {
  productId: number;
  className?: string;
}

export function HygieneBadge({ productId, className }: HygieneBadgeProps) {
  const { data: hygiene, isLoading } = useQuery({
    queryKey: ['hygiene-latest', productId],
    queryFn: () => hygieneApi.getLatestForProduct(productId).then(res => res.data),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground animate-pulse", className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>التحقق من حالة التعقيم...</span>
      </div>
    );
  }

  if (!hygiene || hygiene.status !== 'completed') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
        "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        "text-[10px] font-bold uppercase tracking-wider",
        className
      )}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span className="flex items-center gap-1">
        تم التعقيم بنجاح
        {hygiene.completed_at && (
          <span className="opacity-60 font-normal">
            ({format(new Date(hygiene.completed_at), 'dd MMM', { locale: ar })})
          </span>
        )}
      </span>
    </motion.div>
  );
}

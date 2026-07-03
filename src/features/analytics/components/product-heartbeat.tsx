"use client";

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Activity, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ProductHeartbeat - Live Asset Activity Monitor.
 * Phase 13: Mastery Finalization.
 * 
 * Features:
 * - Real-time active viewer count (polling).
 * - "Elite Pulse" animation for high-traffic assets.
 * - Arabic/English bilingual transparency.
 */

interface ProductHeartbeatProps {
  productId: number;
  className?: string;
}

export function ProductHeartbeat({ productId, className }: ProductHeartbeatProps) {
  const { data: activity, isLoading } = useQuery({
    queryKey: ['product-activity', productId],
    queryFn: () => analyticsApi.getProductActivity(productId).then(res => res.data),
    refetchInterval: 10000, // 10s heartbeat
    enabled: !!productId,
  });

  const activeViewers = activity?.active_users || 0;
  const totalViews = activity?.total_views || 0;
  const isHot = activeViewers > 3;

  return (
    <div className={cn("flex items-center gap-6", className)} dir="rtl">
        
        {/* 1. The Pulse Orb */}
        <div className="relative flex items-center justify-center w-10 h-10">
            <motion.div 
                animate={{ 
                    scale: isHot ? [1, 1.4, 1] : [1, 1.2, 1],
                    opacity: isHot ? [0.2, 0.5, 0.2] : [0.1, 0.3, 0.1]
                }}
                transition={{ repeat: Infinity, duration: isHot ? 1 : 2 }}
                className={cn(
                    "absolute inset-0 rounded-full blur-md",
                    isHot ? "bg-red-500" : "bg-sovereign-gold"
                )}
            />
            <Activity className={cn(
                "w-5 h-5 relative z-10",
                isHot ? "text-red-500 animate-pulse" : "text-sovereign-gold"
            )} />
        </div>

        {/* 2. Numeric Intel */}
        <div className="flex flex-col">
            <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                    <motion.span 
                        key={activeViewers}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-lg font-black italic text-white/90 leading-none font-mono"
                    >
                        {activeViewers}
                    </motion.span>
                </AnimatePresence>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">يشاهدون الآن</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <Users className="w-3 h-3 text-white/20" />
                <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] italic">
                   {totalViews.toLocaleString()} Total Engagements
                </span>
            </div>
        </div>

        {/* 3. Status Tag */}
        {isHot && (
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-gold-pulse">
                High Demand
            </Badge>
        )}
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("inline-flex items-center border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
            {children}
        </div>
    );
}

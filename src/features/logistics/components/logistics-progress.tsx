"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Navigation2,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';

/**
 * LogisticsProgress - The High-Precision Pipeline.
 * Moved to src/features/logistics/components/logistics-progress.tsx (Phase 11).
 * 
 * Principles:
 * - Real-time Transit: GPS Pulse simulation.
 * - Pill & Airy: 32px-40px radius and 16rem step gaps.
 * - Sovereign Standard: Gold active states and obsidian backgrounds.
 */

type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

interface LogisticsProgressProps {
  status: DeliveryStatus;
}

const steps = [
  { id: 'pending', icon: Clock, label: 'تجهيز الطلب السيادي', label_en: 'Protocol Initialized' },
  { id: 'assigned', icon: Box, label: 'تغليف المعايير النخبوية', label_en: 'Elite Packaging' },
  { id: 'in_transit', icon: Navigation2, label: 'قيد النقل الجغرافي', label_en: 'In Transit Pulse' },
  { id: 'delivered', icon: MapPin, label: 'تم الاستلام النهائي', label_en: 'Final Delivery' },
];

export function LogisticsProgress({ status }: LogisticsProgressProps) {
  const currentStepIndex = steps.findIndex(s => {
    if (status === 'delivered') return true;
    if (status === 'in_transit' && s.id === 'in_transit') return true;
    if (['assigned', 'picked_up'].includes(status) && s.id === 'assigned') return true;
    if (status === 'pending' && s.id === 'pending') return true;
    return false;
  });

  return (
    <div className="w-full space-y-16 py-10" dir="rtl">
      
      {/* 1. High-Precision Timeline */}
      <div className="relative h-24 flex justify-between items-center px-10">
        {/* Background Track Rail */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.05] -translate-y-1/2 rounded-full" />
        
        {/* Active Progress Line (Liquid Gold) */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
          className="absolute top-1/2 left-0 h-[1.5px] bg-sovereign-gold -translate-y-1/2 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.5)]"
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor: isActive || isCompleted ? 'rgba(197, 160, 89, 1)' : 'rgba(255, 255, 255, 0.02)',
                  scale: isActive ? 1.25 : 1,
                  rotate: isActive ? 5 : 0
                }}
                className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center border-2 transition-all duration-1000 backdrop-blur-md",
                  isActive || isCompleted 
                    ? "border-sovereign-gold text-sovereign-obsidian shadow-2xl shadow-sovereign-gold/20" 
                    : "border-white/5 text-white/10"
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                
                {/* Active Pulse Glow */}
                {isActive && (
                    <div className="absolute inset-0 bg-sovereign-gold rounded-[24px] blur-xl opacity-20 animate-pulse" />
                )}
              </motion.div>
              
              <div className="absolute top-20 flex flex-col items-center gap-1.5 min-w-[140px] text-center">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-700",
                    isActive || isCompleted ? "text-white/90" : "text-white/10"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{step.label_en}</p>
                  
                  {isActive && (
                    <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1, 0.95] }} 
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="flex items-center gap-2 mt-2"
                    >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Live Pulse Tracking</span>
                    </motion.div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Situational Logistics Awareness */}
      <div className="pt-10">
        {(status === 'failed' || status === 'cancelled') ? (
            <GlassPanel className="p-8 flex items-center gap-8 border-red-500/20" variant="obsidian">
               <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-xl font-black italic tracking-tighter text-red-500">تم تعليق البروتوكول اللوجستي</h4>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">
                    تم اكتشاف خلل في مسار التوصيل السيادي. فريق ReadyRent "الدعم النخبوي" سيتصل بك فوراً لتسوية الوضع.
                  </p>
               </div>
            </GlassPanel>
        ) : (
            <GlassPanel className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 overflow-hidden relative" variant="default" gradientBorder>
                <div className="space-y-4 relative z-10 max-w-xl">
                   <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase">High Mobility State</Badge>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Live GPS Telemetry</span>
                   </div>
                   <h4 className="text-2xl font-black italic tracking-tighter text-white/90">بوابة التتبع السيادي (Nav Pulse)</h4>
                   <p className="text-sm text-white/40 leading-relaxed font-medium italic">
                      يتم تتبع الأصول عبر نظام ReadyRent "Standard Navigation" بترميز عسكري لضمان الوصول بأمان تام وخصوصية مطلقة.
                   </p>
                </div>
                
                <div className="flex gap-6 relative z-10">
                   <div className="px-8 py-5 bg-white/[0.02] rounded-[24px] border border-white/5 flex flex-col items-center gap-2 group hover:bg-white/[0.05] transition-all">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">الوكيل المعتمد</span>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-sovereign-gold animate-pulse" />
                        <span className="text-base font-black italic text-white/80">Premium Runner #42</span>
                      </div>
                   </div>
                   <div className="px-8 py-5 bg-white/[0.02] rounded-[24px] border border-white/5 flex flex-col items-center gap-2 group hover:bg-white/[0.05] transition-all">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">وقت الوصول التقديري</span>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-sovereign-gold" />
                        <span className="text-base font-black italic text-white/80">~42 Minutes</span>
                      </div>
                   </div>
                </div>

                {/* 🚚 Heavy Watermark */}
                <Truck className="absolute -bottom-16 -left-16 w-64 h-64 text-sovereign-gold/[0.03] -rotate-12 pointer-events-none group-hover:-rotate-0 transition-transform duration-1000" />
            </GlassPanel>
        )}
      </div>

    </div>
  );
}

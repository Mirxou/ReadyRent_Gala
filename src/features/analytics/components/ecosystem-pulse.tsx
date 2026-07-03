"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';

/**
 * EcosystemPulse - The Heartbeat of Standard.
 * Moved to src/features/analytics/components/ecosystem-pulse.tsx (Phase 11).
 * 
 * Principles:
 * - Real-time Perception: Low-latency UI updates.
 * - Geographic Authority: Referencing Algerian cities (Oran, Algiers, Constantine).
 * - Airy Design: High-padding, breadcrumb-style text.
 */

export function EcosystemPulse() {
  const events = [
    { type: 'contract', text: 'تم توقيع عقد #ST-10292 في "وهران" (بضمان ReadyRent).', icon: Lock, color: 'text-sovereign-gold' },
    { type: 'hygiene', text: 'اكتمال تدقيق النظافة للأصل #429 (درجة بلاتينية).', icon: ShieldCheck, color: 'text-emerald-500' },
    { type: 'search', text: 'تم إيجاد مطابقة ذكية لـ "قفطان عاصمي ملكي".', icon: Search, color: 'text-sovereign-blue' },
    { type: 'delivery', text: 'نبض اللوجستيات: الأصل #882 قيد التسليم للمرسل V.4.', icon: MapPin, color: 'text-blue-500' },
    { type: 'trust', text: 'المستخدم @Abbas حقق مستوى الثقة السيادي (88).', icon: Sparkles, color: 'text-amber-500' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000); // Slower, more dignified pulse
    return () => clearInterval(timer);
  }, []);

  const event = events[currentIndex];

  return (
    <div className="w-full" dir="rtl">
        <GlassPanel className="p-8 flex items-center gap-8 group hover:border-sovereign-gold/30 transition-all duration-700 cursor-default" variant="default" gradientBorder>
            
            {/* 1. Dynamic Icon Shield */}
            <div className="relative">
                <div className="w-14 h-14 rounded-[20px] bg-white/[0.03] border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentIndex}
                            initial={{ y: 20, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                            className={cn("w-6 h-6", event.color)}
                        >
                            <event.icon className="w-full h-full" />
                        </motion.div>
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-sovereign-obsidian shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            </div>

            {/* 2. Narrative Content */}
            <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">نبض المنظومة</span>
                    <TrendingUp className="w-3 h-3 text-white/30" />
                </div>
                <AnimatePresence mode="wait">
                    <motion.p 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                        className="text-lg font-black text-white/90 truncate italic tracking-tight"
                    >
                        "{event.text}"
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* 3. Status Badge */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] rounded-full border border-white/5 group-hover:bg-sovereign-gold/10 group-hover:border-sovereign-gold/20 transition-all duration-700">
                <div className="w-2.5 h-2.5 rounded-full bg-sovereign-gold animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-sovereign-gold italic">Real-time Pulse</span>
            </div>

        </GlassPanel>
    </div>
  );
}

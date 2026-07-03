"use client";

import React, { useState } from 'react';
import { Calendar } from '@/shared/components/ui/calendar';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/shared/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { CalendarIcon, Clock, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SovereignCalendar - The Temporal Lease Agreement.
 * Moved to src/shared/components/sovereign/sovereign-calendar.tsx (Phase 11).
 * 
 * Principles:
 * - Fluid Date Perception: Spring animations for date selection.
 * - Airy Design: High-padding, 40px radius containers.
 * - Gold Accents: Sovereign Gold for selection states.
 */

interface SovereignCalendarProps {
  productId: number;
  pricePerDay: number;
  onDateSelect?: (startDate: Date | null, endDate: Date | null) => void;
}

export function SovereignCalendar({
  productId,
  pricePerDay,
  onDateSelect,
}: SovereignCalendarProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      onDateSelect?.(date, null);
    } else {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(null);
        onDateSelect?.(date, null);
      } else {
        setEndDate(date);
        onDateSelect?.(startDate, date);
      }
    }
  };

  const daysCount = (startDate && endDate) 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 
    : 0;

  return (
    <div className="space-y-10" dir="rtl">
      
      {/* 1. The Core Calendar Shell */}
      <GlassPanel className="p-8 bg-white/[0.02] border-white/5 shadow-2xl" variant="default" gradientBorder>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="p-0 text-white/90"
              classNames={{
                nav_button: "bg-white/5 border-white/10 hover:bg-white/10 rounded-full",
                day_selected: "bg-sovereign-gold text-sovereign-obsidian hover:bg-sovereign-gold hover:text-sovereign-obsidian focus:bg-sovereign-gold focus:text-sovereign-obsidian rounded-[14px] shadow-[0_0_20px_rgba(197,160,89,0.4)] font-black scale-110",
                day_today: "border border-sovereign-gold/30 text-sovereign-gold font-black italic",
                day_disabled: "text-white/10 opacity-20 pointer-events-none",
                day_outside: "text-white/5 opacity-10",
                day: "h-10 w-10 p-0 font-bold text-xs transition-all hover:bg-white/5 rounded-[12px] m-0.5",
                head_cell: "text-white/20 font-black uppercase tracking-[0.2em] text-[8px] pb-4",
              }}
            />
          </div>
      </GlassPanel>

      {/* 2. Temporal Visual Feedback */}
      <AnimatePresence>
        {startDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-6 px-4">
               <div className="p-6 bg-white/[0.03] rounded-[24px] border border-white/5 flex flex-col items-center gap-2 group hover:bg-white/[0.05] transition-all">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic mb-1">Init Signature</span>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-sovereign-gold" />
                    <span className="text-sm font-black italic text-white/80">{startDate.toLocaleDateString('ar-DZ')}</span>
                  </div>
               </div>
               <div className={cn(
                  "p-6 rounded-[24px] border flex flex-col items-center gap-2 transition-all duration-700",
                  endDate ? "bg-sovereign-gold shadow-[0_20px_50px_rgba(197,160,89,0.3)] text-sovereign-obsidian border-sovereign-gold" : "bg-white/[0.02] border-dashed border-white/10 text-white/10"
               )}>
                  <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.4em] italic mb-1",
                      endDate ? "text-sovereign-obsidian/40" : "text-white/10"
                  )}>
                    {endDate ? 'Final Sealing' : 'Select End'}
                  </span>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={cn("w-4 h-4", endDate ? "text-sovereign-obsidian/60" : "text-white/5")} />
                    <span className="text-sm font-black italic">{endDate ? endDate.toLocaleDateString('ar-DZ') : '-- / -- / --'}</span>
                  </div>
               </div>
            </div>

            {/* 3. Value Realization Card */}
            {endDate && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 bg-gradient-to-l from-sovereign-gold/10 to-transparent border border-white/5 rounded-[40px] flex items-center justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sovereign-gold/5 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="space-y-2">
                   <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-sovereign-gold" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Durée de Validité</p>
                   </div>
                   <p className="text-3xl font-black italic tracking-tighter text-white/90">
                      {daysCount} <span className="text-lg text-sovereign-gold opacity-60">أيام سيادية</span>
                   </p>
                </div>

                <div className="text-left space-y-2">
                   <div className="flex items-center justify-end gap-3">
                        <Zap className="w-4 h-4 text-sovereign-gold/40" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Valeur de l'Engagement</p>
                   </div>
                   <p className="text-4xl font-black italic tracking-tighter text-sovereign-gold font-mono">
                      {(daysCount * pricePerDay).toLocaleString()} <span className="text-xs opacity-40">DZD</span>
                   </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

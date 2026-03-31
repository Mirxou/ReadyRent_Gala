"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Gavel, 
  RefreshCcw, 
  CheckCircle2, 
  AlertTriangle,
  Wallet,
  Coins,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';

/**
 * EscrowTracker - The Financial Guardian.
 * Moved to src/features/finance/components/escrow-tracker.tsx (Phase 11).
 * 
 * Principles:
 * - Legal Density: Detailed state descriptions.
 * - Pill & Airy: 32px radius and 8rem internal spacing (p-10).
 * - Sovereign Palette: Gold for 'Held', Emerald for 'Settled', Red for 'Disputed'.
 */

export type EscrowState = 'pending' | 'held' | 'released' | 'refunded' | 'disputed' | 'cancelled' | 'split_released';

interface EscrowTrackerProps {
  state: EscrowState;
  amount: string | number;
  currency?: string;
  updatedAt?: string;
}

const escrowSteps = [
  { id: 'pending', icon: Wallet, label: 'تأمين الموارد', label_en: 'Securing', color: 'blue' },
  { id: 'held', icon: Lock, label: 'في الخزانة السيادية', label_en: 'Vaulted', color: 'gold' },
  { id: 'settled', icon: ShieldCheck, label: 'تمت التسوية', label_en: 'Settled', color: 'emerald' },
];

export function EscrowTracker({ state, amount, currency = 'DZD', updatedAt }: EscrowTrackerProps) {
  
  // Calculate index for the 3-stage visual progress
  let currentStepIndex = 0;
  if (state === 'pending') currentStepIndex = 0;
  else if (['held', 'disputed'].includes(state)) currentStepIndex = 1;
  else currentStepIndex = 2; // Terminal states

  const isDisputed = state === 'disputed';
  const isTerminal = ['released', 'refunded', 'cancelled', 'split_released'].includes(state);

  return (
    <div className="w-full" dir="rtl">
        <GlassPanel className="p-10 overflow-hidden relative border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)]" variant="obsidian" gradientBorder>
            
            {/* 🪙 Ambient Glow Layer */}
            <div className={cn(
                "absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000 opacity-20",
                state === 'held' ? "bg-sovereign-gold" : 
                state === 'disputed' ? "bg-red-500" : 
                isTerminal ? "bg-emerald-500" : "bg-blue-500"
            )} />

            <div className="relative z-10 space-y-12">
                
                {/* 1. Fiscal Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-sovereign-gold/20 to-transparent rounded-lg border border-sovereign-gold/20">
                                <Coins className="w-5 h-5 text-sovereign-gold" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Legal Escrow Protocol</span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <h3 className="text-5xl font-black italic tracking-tighter text-white/90 font-mono">
                                {amount.toLocaleString()}
                            </h3>
                            <span className="text-sm font-black text-sovereign-gold uppercase tracking-widest">{currency}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={state}
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                className={cn(
                                    "px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 italic backdrop-blur-xl transition-all duration-700",
                                    state === 'held' ? "border-sovereign-gold/40 text-sovereign-gold bg-sovereign-gold/10" :
                                    state === 'disputed' ? "border-red-500/40 text-red-500 bg-red-500/10" :
                                    isTerminal ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10" :
                                    "border-white/10 text-white/30 bg-white/5"
                                )}
                            >
                                <div className={cn("w-2 h-2 rounded-full animate-soft-pulse shadow-sm", 
                                    state === 'held' ? "bg-sovereign-gold" : 
                                    state === 'disputed' ? "bg-red-500" : 
                                    isTerminal ? "bg-emerald-500" : "bg-blue-500"
                                )} />
                                {state.replace('_', ' ')}
                            </motion.div>
                        </AnimatePresence>
                        {updatedAt && (
                            <div className="flex items-center gap-2 opacity-20">
                                <History className="w-3 h-3" />
                                <span className="text-[9px] font-bold">آخر تحديث للقيد: {updatedAt}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. The Sovereign Pipeline Track */}
                <div className="relative h-24 flex justify-between items-center px-10">
                    {/* Background Track Rail */}
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/[0.05] -translate-y-1/2 rounded-full" />
                    
                    {/* Liquid Progress Track */}
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStepIndex / 2) * 100}%` }}
                        transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
                        className={cn(
                            "absolute top-1/2 left-0 h-[2px] -translate-y-1/2 rounded-full transition-colors duration-1000",
                            state === 'disputed' 
                                ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]" 
                                : "bg-sovereign-gold shadow-[0_0_20px_rgba(197,160,89,0.4)]"
                        )}
                    />

                    {escrowSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentStepIndex;
                    const isActive = index === currentStepIndex;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: (isActive || isCompleted) ? (isDisputed && isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(197, 160, 89, 0.05)') : 'rgba(255, 255, 255, 0.01)',
                                    borderColor: (isActive || isCompleted) ? (isDisputed && isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(197, 160, 89, 0.3)') : 'rgba(255, 255, 255, 0.05)',
                                }}
                                className="w-16 h-16 rounded-[24px] border-2 flex items-center justify-center transition-all duration-1000 backdrop-blur-md relative group"
                            >
                                <Icon className={cn(
                                    "w-6 h-6 transition-all duration-700",
                                    (isActive || isCompleted) 
                                        ? (isDisputed && isActive ? "text-red-500" : "text-sovereign-gold") 
                                        : "text-white/10"
                                )} />
                                
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]" />

                                {/* Verification Badge Overlay */}
                                {isCompleted && (
                                    <motion.div 
                                        initial={{ scale: 0, rotate: -20 }} 
                                        animate={{ scale: 1, rotate: 0 }} 
                                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-sovereign-obsidian shadow-lg"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-sovereign-obsidian" />
                                    </motion.div>
                                )}
                            </motion.div>
                            
                            <div className="absolute top-20 flex flex-col items-center gap-1 min-w-[120px]">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                    isActive || isCompleted ? "text-white/90" : "text-white/10"
                                )}>
                                    {step.label}
                                </span>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">{step.label_en}</span>
                            </div>
                        </div>
                    );
                    })}
                </div>

                {/* 3. Jurisdictional Insight Box */}
                <div className="pt-10">
                    <AnimatePresence mode="wait">
                        {state === 'disputed' ? (
                            <motion.div 
                                key="dispute-alert"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 rounded-[32px] bg-red-500/5 border border-red-500/10 flex items-start gap-6 relative overflow-hidden"
                            >
                                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                    <Gavel className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase text-red-500 tracking-[0.2em] italic">تجميد قضائي نشط (Judicial Freeze)</h4>
                                    <p className="text-xs text-white/40 leading-loose italic font-medium">
                                        تم قفل الموارد المالية تحت سلطة ReadyRent "المحكمة السيادية" حتى يتم الفصل في النزاع القائم. يتم الحفاظ على حقوق الطرفين بدقة ميكانيكية.
                                    </p>
                                </div>
                                <div className="absolute top-0 left-0 w-2 h-full bg-red-500/30" />
                            </motion.div>
                        ) : state === 'held' ? (
                            <motion.div 
                                key="held-info"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 rounded-[32px] bg-sovereign-gold/5 border border-sovereign-gold/10 flex items-start gap-6 relative overflow-hidden"
                            >
                                <div className="p-3 bg-sovereign-gold/10 rounded-2xl border border-sovereign-gold/20">
                                    <Unlock className="w-6 h-6 text-sovereign-gold" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase text-sovereign-gold tracking-[0.2em] italic">ضمان سيادي مفعّل (Escrow Active)</h4>
                                    <p className="text-xs text-white/40 leading-loose italic font-medium">
                                        المبلغ مؤمن حالياً في الخزنة الرقمية. سيتم تحويل الاستحقاق للمؤجر فور انتهاء فترة الحجز والتأكد من سلامة الأصل المسترجع.
                                    </p>
                                </div>
                                <div className="absolute top-0 left-0 w-2 h-full bg-sovereign-gold/30" />
                            </motion.div>
                        ) : isTerminal ? (
                            <motion.div 
                                key="terminal-info"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-6 relative overflow-hidden"
                            >
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase text-emerald-500 tracking-[0.2em] italic">تصفية نهائية (Final Settlement)</h4>
                                    <p className="text-xs text-white/40 leading-loose italic font-medium">
                                        تمت تصفية المعاملة المالية بنجاح. تم تحويل كافة الحقوق المالية للأطراف المعنية وفقاً لبنود العقد السيادي والبروتوكول البنكي.
                                    </p>
                                </div>
                                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/30" />
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

            </div>
        </GlassPanel>
    </div>
  );
}

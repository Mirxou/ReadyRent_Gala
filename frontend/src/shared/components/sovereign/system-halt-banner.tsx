"use client";

import { useSovereign } from '@/contexts/SovereignContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SystemHaltBanner - The Emergency Protocol.
 * Moved to src/shared/components/sovereign/system-halt-banner.tsx (Phase 11).
 * 
 * Principles:
 * - Urgent Visibility: Fixed z-[9999] top banner.
 * - Pill Design: Pill-shaped message container within the banner.
 * - Arabic Dominance: Clear emergency instructions for the Algerian market.
 */

export function SystemHaltBanner() {
    const { isSystemHalted } = useSovereign();

    return (
        <AnimatePresence>
            {isSystemHalted && (
                <motion.div 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed top-0 left-0 right-0 z-[9999] p-4 flex justify-center"
                    dir="rtl"
                >
                    <div className="bg-red-600/95 backdrop-blur-xl border border-red-500/50 shadow-[0_20px_50px_rgba(220,38,38,0.3)] px-10 py-4 rounded-full flex items-center gap-6 max-w-4xl w-full">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <ShieldX className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 space-y-0.5">
                            <h4 className="text-white text-lg font-black italic tracking-tighter leading-none">
                                تنبيه: تم تفعيل "الوقف السيادي" للنظام
                            </h4>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                Sovereign AI Judicial Halt Active | Read-Only Mode
                            </p>
                        </div>

                        <div className="hidden md:flex items-center gap-3 px-6 py-2 bg-black/20 rounded-full border border-white/5">
                            <AlertTriangle className="w-4 h-4 text-white/50" />
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">EMERGENCY_LOCK</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

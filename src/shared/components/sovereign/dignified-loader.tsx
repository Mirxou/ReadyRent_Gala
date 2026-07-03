"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * DignifiedLoader - The Sovereign Standard.
 * Moved to src/shared/components/sovereign/dignified-loader.tsx (Phase 11).
 * 
 * Principles:
 * - Breathing Rhythm: Slow scale pulses (0.32, 0.72, 0, 1).
 * - Multi-layer Transparency: 3 layers of ring pulses.
 * - Arabic Localization: Centralized status labels for the Algerian market.
 */

interface DignifiedLoaderProps {
    label?: string;
    subLabel?: string;
    className?: string;
}

export function DignifiedLoader({ 
    label = "جاري التحقق الرقمي...", 
    subLabel = "بروتوكول الأمان السيادي قيد التنفيذ",
    className 
}: DignifiedLoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-10 p-16", className)} dir="rtl">
            {/* 1. The Breathing Sovereign Ring System */}
            <div className="relative w-32 h-32">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-sovereign-gold/30"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.4, 1.8],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 1,
                            ease: [0.32, 0.72, 0, 1]
                        }}
                    />
                ))}

                {/* 2. Core Rotating Icon Shield */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-[3px] border-t-sovereign-gold border-r-sovereign-gold/40 border-b-transparent border-l-transparent rounded-full shadow-[0_0_30px_rgba(197,160,89,0.2)]"
                    />
                </div>
            </div>

            {/* 3. Narrative Feedback */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                className="text-center space-y-3"
            >
                <h4 className="text-2xl font-black italic tracking-tighter text-white/90">
                    {label}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">
                    {subLabel}
                </p>
            </motion.div>

            {/* 4. Subtle Shimmer Line (Footer) */}
            <div className="w-48 h-[1px] bg-white/5 relative overflow-hidden rounded-full">
                <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-sovereign-gold/40 to-transparent" 
                />
            </div>
        </div>
    );
}

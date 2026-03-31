"use client";

import { useSovereign } from '@/contexts/SovereignContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, ShoppingBag, Scale, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SovereignGlow } from './sovereign-sparkle';

/**
 * ModeSwitcher - The Reality Toggle.
 * Moved to src/shared/components/sovereign/mode-switcher.tsx (Phase 11).
 * 
 * Principles:
 * - Fluid Transitions: Spring-based layout animations.
 * - High Contrast: Obsidian vs Gold active states.
 * - Pill Design: 999px radius (The Pill Recipe).
 */

export function ModeSwitcher() {
    const { mode, setMode } = useSovereign();

    const modes = [
        { id: 'MARKET', label: 'رواق السوق', icon: ShoppingBag, color: 'text-blue-400' },
        { id: 'DISPUTE', label: 'المحكمة السيادية', icon: Gavel, color: 'text-red-400' },
        { id: 'VERDICT', label: 'سجل البراهين', icon: Scale, color: 'text-sovereign-gold' },
    ] as const;

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]" dir="rtl">
            <div className="bg-sovereign-obsidian/80 backdrop-blur-2xl border border-white/5 rounded-full p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2">
                {modes.map((m) => {
                    const isActive = mode === m.id;
                    const Icon = m.icon;

                    return (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={cn(
                                "relative flex items-center justify-center h-12 px-6 rounded-full transition-all duration-500 group",
                                isActive ? "text-sovereign-black" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeModePill"
                                    className="absolute inset-0 bg-sovereign-gold rounded-full shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                                    transition={{ type: "spring", bounce: 0.25, duration: 0.8 }}
                                />
                            )}
                            
                            <span className="relative z-10 flex items-center gap-3">
                                <Icon className={cn("w-4 h-4 transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110")} />
                                
                                <AnimatePresence mode="wait">
                                    {isActive && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0, x: 10 }}
                                            animate={{ width: 'auto', opacity: 1, x: 0 }}
                                            exit={{ width: 0, opacity: 0, x: 10 }}
                                            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                                            className="overflow-hidden whitespace-nowrap text-xs font-black italic tracking-tighter"
                                        >
                                            {m.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </span>

                            {isActive && (
                                <div className="absolute -top-1 -left-1">
                                    <Sparkles className="w-3 h-3 text-white/50 animate-pulse" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

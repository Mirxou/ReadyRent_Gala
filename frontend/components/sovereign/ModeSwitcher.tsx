'use client';

import { useSovereign } from '@/contexts/SovereignContext';
import { motion } from 'framer-motion';
import { Gavel, ShoppingBag, Scale } from 'lucide-react';

export function ModeSwitcher() {
    const { mode, setMode } = useSovereign();

    const modes = [
        { id: 'MARKET', label: 'السوق', icon: ShoppingBag, color: 'text-blue-500' },
        { id: 'DISPUTE', label: 'القضاء', icon: Gavel, color: 'text-slate-500' },
        { id: 'VERDICT', label: 'الحكم', icon: Scale, color: 'text-amber-500' },
    ] as const;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-xl flex gap-1 z-50">
            {modes.map((m) => {
                const isActive = mode === m.id;
                const Icon = m.icon;

                return (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`
              relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}
            `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeMode"
                                className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon size={16} className={isActive ? m.color : ''} />
                            {isActive && (
                                <motion.span
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    {m.label}
                                </motion.span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

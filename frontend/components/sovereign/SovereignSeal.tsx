'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SovereignSealProps {
    type: 'SHIELD_SILVER' | 'BALANCE_GOLD' | 'DOCUMENT_GREY';
    refId: string;
    className?: string;
    animate?: boolean;
}

export function SovereignSeal({ type, refId, className, animate = true }: SovereignSealProps) {
    const colors = {
        SHIELD_SILVER: {
            primary: '#94a3b8', // Slate-400
            secondary: '#475569', // Slate-600
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            )
        },
        BALANCE_GOLD: {
            primary: '#fbbf24', // Amber-400
            secondary: '#b45309', // Amber-700
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            )
        },
        DOCUMENT_GREY: {
            primary: '#d1d5db', // Gray-300
            secondary: '#4b5563', // Gray-600
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )
        }
    };

    const theme = colors[type];

    return (
        <div className={cn("relative flex flex-col items-center justify-center p-6 select-none", className)}>
            {/* Rotating Border Ring */}
            <motion.div
                initial={{ rotate: 0 }}
                animate={animate ? { rotate: 360 } : {}}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[1px] border-dashed opacity-30"
                style={{ borderColor: theme.primary }}
            />

            {/* Inner Static Ring */}
            <div className="absolute inset-2 rounded-full border-[1px] opacity-20" style={{ borderColor: theme.secondary }} />

            {/* The Icon */}
            <motion.svg
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-12 h-12 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke={theme.primary}
            >
                {theme.icon}
            </motion.svg>

            {/* Label */}
            <div className="text-xs uppercase tracking-[0.2em] font-serif font-bold text-center mt-2" style={{ color: theme.secondary }}>
                {type.replace('_', ' ')}
            </div>

            {/* Ref ID */}
            <div className="text-[10px] font-mono mt-1 opacity-60" style={{ color: theme.secondary }}>
                REF: {refId}
            </div>

            {/* Shine Effect */}
            {animate && (
                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                    <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-[shimmer_3s_infinite]" />
                </div>
            )}
        </div>
    );
}

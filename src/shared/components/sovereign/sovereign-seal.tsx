"use client";

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * SovereignSeal - The Digital Signet.
 * Moved to src/shared/components/sovereign/sovereign-seal.tsx (Phase 11).
 * 
 * Principles:
 * - Immutable Authority: Rotating border implies constant verification.
 * - Material Fidelity: Silver, Gold, and Slate materials.
 * - High-DPI Rendering: Precise SVG paths.
 */

interface SovereignSealProps {
    type: 'SHIELD_SILVER' | 'BALANCE_GOLD' | 'DOCUMENT_GREY';
    refId: string;
    className?: string;
    animate?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function SovereignSeal({ type, refId, className, animate = true, size = 'md' }: SovereignSealProps) {
    const config = {
        SHIELD_SILVER: {
            primary: '#94a3b8',
            secondary: '#475569',
            glow: 'rgba(148, 163, 184, 0.2)',
            label: 'ختم الحماية (Silver)',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            )
        },
        BALANCE_GOLD: {
            primary: '#fbbf24',
            secondary: '#b45309',
            glow: 'rgba(251, 191, 36, 0.2)',
            label: 'ميزان العدل (Gold)',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            )
        },
        DOCUMENT_GREY: {
            primary: '#d1d5db',
            secondary: '#4b5563',
            glow: 'rgba(209, 213, 223, 0.2)',
            label: 'ميثاق الحق (Slate)',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )
        }
    };

    const theme = config[type];
    
    const sizes = {
        sm: 'w-24 h-24',
        md: 'w-36 h-36',
        lg: 'w-48 h-48'
    };

    const iconSizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className={cn("relative flex flex-col items-center justify-center select-none", sizes[size], className)} dir="rtl">
            {/* 1. Rotating Inner Ring */}
            <motion.div
                initial={{ rotate: 0 }}
                animate={animate ? { rotate: 360 } : {}}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border-[2px] border-dashed opacity-20"
                style={{ borderColor: theme.primary }}
            />

            {/* 2. Outer Static Sovereign Ring */}
            <div className="absolute inset-0 rounded-full border-[1px] border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-2xl" />

            {/* 3. The Central Icon with Pulse */}
            <div className="relative z-10 flex flex-col items-center gap-2 pt-2">
                <motion.svg
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                    className={cn(iconSizes[size], "drop-shadow-2xl")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={theme.primary}
                >
                    {theme.icon}
                </motion.svg>

                <div className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 text-center" style={{ color: theme.secondary }}>
                    {theme.label}
                </div>

                <div className="text-[7px] font-mono opacity-20" style={{ color: theme.secondary }}>
                    REF: {refId}
                </div>
            </div>

            {/* 4. Material Shine Effect */}
            {animate && (
                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-40">
                    <motion.div 
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg]" 
                    />
                </div>
            )}
        </div>
    );
}

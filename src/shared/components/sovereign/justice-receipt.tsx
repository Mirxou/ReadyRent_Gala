"use client";

import { motion } from 'framer-motion';
import { Share2, Download, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { SovereignSeal } from './sovereign-seal';
import { ReceiptStage } from '@/types/sovereign';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';

/**
 * JusticeReceipt - The Immutable Record.
 * Moved to src/shared/components/sovereign/justice-receipt.tsx (Phase 11).
 * 
 * Principles:
 * - Forensic Transparency: Timeline of justice stages.
 * - Material Luxury: Torn gold-edge effect.
 * - Pill & Airy: 40px radius and breathable padding.
 */

interface JusticeReceiptProps {
    stages: ReceiptStage[];
    disputeId: string;
    finalVerdict?: string;
}

export function JusticeReceipt({ stages, disputeId, finalVerdict }: JusticeReceiptProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-md w-full relative"
            dir="rtl"
        >
            <GlassPanel className="p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" variant="obsidian" gradientBorder>
                
                {/* 1. Receipt Top Edge (Torn Gold-Paper Effect) */}
                <div className="h-4 bg-sovereign-gold/5 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] border-b border-dashed border-sovereign-gold/20"></div>
                    <div className="absolute -top-2 left-0 right-0 flex justify-between px-1">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-sovereign-obsidian -mt-3" />
                        ))}
                    </div>
                </div>

                <div className="p-10 flex flex-col items-center gap-8">
                    {/* Header: Title & Ref */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black italic tracking-tighter text-white/90">إيصال العدالة</h2>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black font-mono text-sovereign-gold/40 tracking-[0.2em] uppercase">
                            <FileText className="w-3 h-3" />
                            JUSTICE RECORD #{disputeId}
                        </div>
                    </div>

                    {/* 2. The Great Seal */}
                    <SovereignSeal
                        type={finalVerdict ? 'BALANCE_GOLD' : 'SHIELD_SILVER'}
                        refId={disputeId}
                        size="md"
                        className="my-4"
                    />

                    {/* 3. Forensic Timeline */}
                    <div className="w-full space-y-8 relative px-4">
                        {/* Vertical Progress Line */}
                        <div className="absolute right-[31px] top-4 bottom-4 w-[1px] bg-white/5" />

                        {stages.map((stage, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1, duration: 0.6 }}
                                className="flex items-start gap-6 relative"
                            >
                                {/* Status Orb */}
                                <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-700 
                                    ${stage.status === 'completed' 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                        : stage.status === 'active' 
                                            ? 'bg-sovereign-gold/10 border-sovereign-gold text-sovereign-gold animate-pulse' 
                                            : 'bg-white/5 border-white/5 text-white/20'
                                    }`}
                                >
                                    {stage.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                </div>

                                {/* Stage Narrative */}
                                <div className="flex-1 space-y-1">
                                    <h4 className={`text-sm font-black italic tracking-tight ${stage.status === 'pending' ? 'text-white/20' : 'text-white/80'}`}>
                                        {stage.label_ar}
                                    </h4>
                                    {stage.timestamp && (
                                        <div className="text-[9px] font-bold font-mono text-white/20 uppercase tracking-widest">
                                            {stage.timestamp}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 4. The Sovereign Verdict */}
                    {finalVerdict && (
                        <div className="w-full bg-white/[0.03] p-6 rounded-[24px] border border-white/5 text-center space-y-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-sovereign-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 relative z-10">القرار السيادي النهائي</div>
                            <div className="text-xl font-black italic text-white/90 relative z-10 leading-relaxed">
                                {finalVerdict}
                            </div>
                        </div>
                    )}

                    {/* 5. Strategic Actions */}
                    <div className="flex gap-4 w-full pt-4">
                        <SovereignButton variant="secondary" className="flex-1 h-14 text-xs font-black">
                            <Share2 className="ml-2 w-4 h-4" /> مشاركة
                        </SovereignButton>
                        <SovereignButton variant="primary" className="flex-1 h-14 text-xs font-black" withShimmer>
                            <Download className="ml-2 w-4 h-4" /> تحميل النسخة
                        </SovereignButton>
                    </div>

                </div>

                {/* 6. Receipt Bottom Edge (Standard Seal) */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="text-[8px] font-black text-white/10 tracking-[0.5em] uppercase">Sovereign Proof of Justice</div>
                    <ShieldCheck className="w-4 h-4 text-white/10" />
                </div>
            </GlassPanel>
        </motion.div>
    );
}

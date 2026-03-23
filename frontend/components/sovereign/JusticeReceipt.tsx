'use client';

import { motion } from 'framer-motion';
import { Share2, Download, CheckCircle2 } from 'lucide-react';
import { SovereignSeal } from './SovereignSeal';
import { ReceiptStage } from '@/types/sovereign';

interface JusticeReceiptProps {
    stages: ReceiptStage[];
    disputeId: string;
    finalVerdict?: string;
}

export function JusticeReceipt({ stages, disputeId, finalVerdict }: JusticeReceiptProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden relative"
        >
            {/* Receipt Top Edge (Torn Paper Effect) */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 relative">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] border-b border-dashed border-slate-300 dark:border-slate-700"></div>
            </div>

            <div className="p-8 flex flex-col items-center">
                {/* Header */}
                <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">إيصال العدالة</h2>
                <div className="text-xs font-mono text-slate-500 mb-6">JUSTICE RECEIPT #{disputeId}</div>

                {/* The Seal */}
                <SovereignSeal
                    type={finalVerdict ? 'BALANCE_GOLD' : 'SHIELD_SILVER'}
                    refId={disputeId}
                    className="w-48 h-48 mb-6"
                />

                {/* Timeline */}
                <div className="w-full space-y-4 mb-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute right-[15px] top-2 bottom-2 w-[1px] bg-slate-200 dark:bg-slate-700" />

                    {stages.map((stage, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4"
                        >
                            {/* Status Dot */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                  ${stage.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    stage.status === 'active' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse' :
                                        'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'
                                }`}
                            >
                                {stage.status === 'completed' ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <div className={`text-sm font-medium ${stage.status === 'pending' ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {stage.label_ar}
                                </div>
                                {stage.timestamp && (
                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        {stage.timestamp}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Verdict Box */}
                {finalVerdict && (
                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700 text-center mb-6">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">القرار النهائي</div>
                        <div className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                            {finalVerdict}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 w-full">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                        <Share2 size={16} />
                        <span>مشاركة</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity text-sm font-medium">
                        <Download size={16} />
                        <span>تحميل PDF</span>
                    </button>
                </div>
            </div>

            {/* Receipt Bottom Edge */}
            <div className="h-4 bg-transparent relative overflow-hidden">
                <div className="absolute -bottom-2 left-0 right-0 flex justify-between">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800/30 -mx-1" />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

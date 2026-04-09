"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socialApi } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Star, Sparkles, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SovereignButton } from './sovereign-button';

/**
 * VouchButton - The Sigil of Recommendation.
 * Moved to src/shared/components/sovereign/vouch-button.tsx (Phase 11).
 * 
 * Principles:
 * - Golden Exclusive: Only users with elite trust scores (Risk <= 20) can see/use this.
 * - Pill Design: 999px radius (The Pill Recipe).
 * - High-Fidelity Feedback: Gold-glimmer animations upon successful vouching.
 */

interface VouchButtonProps {
    targetUserId: number;
    viewerRiskScore: number;
    initialVouchCount?: number;
    className?: string;
}

export function VouchButton({ 
    targetUserId, 
    viewerRiskScore, 
    initialVouchCount = 0,
    className
}: VouchButtonProps) {
    const [isVouched, setIsVouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [vouchCount, setVouchCount] = useState(initialVouchCount);

    // 🔒 SOVEREIGN GATE: Only Golden Users (Risk Score <= 20) can vouch.
    if (viewerRiskScore > 20) {
        return null;
    }

    const handleVouch = async () => {
        setIsLoading(true);
        try {
            await socialApi.vouch(targetUserId);
            toast.success("تمت تزكية العضو بنجاح سيادي! 🌟", {
                description: "لقد ساهمت برفع رصيد الثقة في المجتمع الجزائري النخبوي."
            });
            setIsVouched(true);
            setVouchCount(prev => prev + 1);
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error("لقد منحت تزكيتك لهذا العضو مسبقاً.");
                setIsVouched(true);
            } else {
                toast.error("فشل بروتوكول التزكية. يرجى المحاولة لاحقاً.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("inline-flex items-center", className)} dir="rtl">
            <AnimatePresence mode="wait">
                {isVouched ? (
                    <motion.div
                        key="vouched"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-[0_10px_20px_rgba(16,185,129,0.1)]"
                    >
                        <UserCheck className="w-4 h-4" />
                        <span className="text-xs font-black italic tracking-tight">تمت التزكية السيادية</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="action"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <SovereignButton
                            onClick={handleVouch}
                            isLoading={isLoading}
                            variant="primary"
                            className="h-12 px-8 rounded-full shadow-[0_15px_35px_rgba(197,160,89,0.3)]"
                            withShimmer
                        >
                            <div className="flex items-center gap-3">
                                <Star className={cn("w-4 h-4", isLoading ? "animate-spin" : "animate-pulse")} />
                                <span className="text-xs font-black italic tracking-tighter">
                                    {isLoading ? 'جاري التوثيق...' : 'تزكية العضو (Vouch)'}
                                </span>
                            </div>
                        </SovereignButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

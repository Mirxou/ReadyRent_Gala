"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, BadgeCheck, Loader2 } from "lucide-react";

/**
 * IdentityShield - The Badge of Honor.
 * Refined for Phase 11: Sovereign Mastery (Pill & Airy Standard).
 * 
 * Principles:
 * - Rite of Passage: Visual hierarchy between Verified and Unverified.
 * - Gold Standard: Verified users get the specific "Sovereign Gold" glow.
 * - Arabic Support: Labels localized for the Algerian market.
 */

interface IdentityShieldProps {
    status: "verified" | "pending" | "unverified" | "rejected";
    trustScore?: number;
    showLabel?: boolean;
    className?: string;
}

export function IdentityShield({
    status,
    trustScore = 0,
    showLabel = true,
    className
}: IdentityShieldProps) {

    interface ShieldState {
        icon: React.ElementType;
        color: string;
        bg: string;
        glow: string;
        label: string;
        animate?: string;
    }

    const config: Record<IdentityShieldProps["status"], ShieldState> = {
        verified: {
            icon: BadgeCheck,
            color: "text-sovereign-gold",
            bg: "bg-sovereign-gold/10 border-sovereign-gold/20",
            glow: "shadow-[0_0_20px_rgba(197,160,89,0.2)]",
            label: "هوية موثقة (Elite)",
        },
        pending: {
            icon: Loader2,
            color: "text-blue-400",
            bg: "bg-blue-400/10 border-blue-400/20",
            glow: "",
            label: "قيد التدقيق (Pending)",
            animate: "animate-spin",
        },
        unverified: {
            icon: ShieldAlert,
            color: "text-gray-400",
            bg: "bg-gray-400/10 border-gray-400/20",
            glow: "",
            label: "غير موثق (Unverified)",
        },
        rejected: {
            icon: ShieldAlert,
            color: "text-red-500",
            bg: "bg-red-500/10 border-red-500/20",
            glow: "",
            label: "هوية مرفوضة (Rejected)",
        },
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
                "inline-flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md",
                current.bg,
                current.glow,
                className
            )}
        >
            <Icon className={cn("w-4 h-4", current.color, current.animate || "")} />

            {showLabel && (
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", current.color)}>
                    {current.label}
                </span>
            )}

            {/* Trust Score Mini-Badge (Only if verified) */}
            {status === 'verified' && trustScore > 0 && (
                <div className="ml-3 pl-3 border-l border-sovereign-gold/30 text-xs font-black text-sovereign-gold font-mono tracking-tighter">
                    {trustScore}
                </div>
            )}
        </motion.div>
    );
}

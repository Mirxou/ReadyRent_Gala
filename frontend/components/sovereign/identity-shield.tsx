"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, BadgeCheck, Loader2 } from "lucide-react";

/**
 * IdentityShield - The Badge of Honor.
 * 
 * Principles:
 * - Rite of Passage: Visual hierarchy between Verified and Unverified.
 * - Gold Standard: Verified users get the specific "Sovereign Gold" glow.
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
            glow: "shadow-[0_0_15px_rgba(197,160,89,0.3)]",
            label: "Verified Sovereign",
        },
        pending: {
            icon: Loader2,
            color: "text-blue-400",
            bg: "bg-blue-400/10 border-blue-400/20",
            glow: "",
            label: "Verification Pending",
            animate: "animate-spin",
        },
        unverified: {
            icon: ShieldAlert,
            color: "text-gray-400",
            bg: "bg-gray-400/10 border-gray-400/20",
            glow: "",
            label: "Unverified",
        },
        rejected: {
            icon: ShieldAlert,
            color: "text-red-500",
            bg: "bg-red-500/10 border-red-500/20",
            glow: "",
            label: "Identity Rejected",
        },
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md",
                current.bg,
                current.glow,
                className
            )}
        >
            <Icon className={cn("w-4 h-4", current.color, current.animate || "")} />

            {showLabel && (
                <span className={cn("text-xs font-medium uppercase tracking-wider", current.color)}>
                    {current.label}
                </span>
            )}

            {/* Trust Score Mini-Badge (Only if verified) */}
            {status === 'verified' && trustScore > 0 && (
                <div className="ml-2 pl-2 border-l border-sovereign-gold/30 text-xs font-bold text-sovereign-gold">
                    {trustScore}
                </div>
            )}
        </motion.div>
    );
}

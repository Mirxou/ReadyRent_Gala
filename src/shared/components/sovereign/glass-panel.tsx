"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

/**
 * GlassPanel - The Container of Clarity.
 * Refined for Phase 11: Sovereign Mastery (Pill & Airy Standard).
 * 
 * Principles:
 * - Airy Spacing: 32px (p-8) padding as default.
 * - Deep Radius: 40px (rounded-[40px]) for that premium feel.
 * - Glassmorphism: High blur, ultra-low opacity.
 */

interface GlassPanelProps extends Omit<HTMLMotionProps<"div">, "children"> {
    gradientBorder?: boolean;
    children?: React.ReactNode;
    variant?: "default" | "obsidian" | "gold";
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
    ({ className, children, gradientBorder = false, variant = "default", ...props }, ref) => {

        const variants = {
            default: "bg-white/60 dark:bg-sovereign-obsidian/40 border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl",
            obsidian: "bg-sovereign-black/80 border-sovereign-gold/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl",
            gold: "bg-sovereign-gold/5 border-sovereign-gold/30 shadow-gold-pulse",
        };

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className={cn(
                    "relative overflow-hidden rounded-[40px] backdrop-blur-2xl border p-8",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {/* Internal Glow for Obsidian variant */}
                {variant === "obsidian" && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sovereign-gold/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                )}

                {/* Gradient Border Overlay (Optional) */}
                {gradientBorder && (
                    <div className="absolute inset-0 rounded-[40px] p-[2px] bg-gradient-to-br from-sovereign-gold/40 via-transparent to-sovereign-gold/10 -z-10" 
                         style={{ maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)', maskComposite: 'exclude' }} />
                )}

                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </motion.div>
        );
    }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };

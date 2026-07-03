"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * SovereignButton - The Button of Authority.
 * Refined for Phase 11: Sovereign Mastery (Pill & Airy Standard).
 * 
 * Principles:
 * - Pill Shape: Absolute authority (999px radius).
 * - Airy Padding: Breathable interaction (12px x 32px standard).
 * - Slow Motion: [0.32, 0.72, 0, 1] Ease-out.
 */

interface SovereignButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost" | "obsidian";
    size?: "sm" | "md" | "lg" | "xl";
    isLoading?: boolean;
    withShimmer?: boolean;
    href?: string;
}

const SovereignButton = React.forwardRef<HTMLButtonElement, SovereignButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, withShimmer = false, children, href, ...props }, ref) => {

        // Variants for ethical timing
        const variants = {
            primary: "bg-sovereign-gold text-sovereign-black border-sovereign-gold hover:bg-sovereign-gold-light",
            secondary: "bg-transparent border-sovereign-gold text-sovereign-gold hover:bg-sovereign-gold/10",
            danger: "bg-red-900/20 border-red-500 text-red-500 hover:bg-red-900/40",
            ghost: "bg-transparent border-transparent text-sovereign-gold hover:bg-sovereign-gold/5",
            obsidian: "bg-sovereign-obsidian text-sovereign-gold border-sovereign-gold/30 hover:border-sovereign-gold animate-gold-pulse",
        };

        // PILL & AIRY SIZES (Refined from skiLL Appendix)
        const sizes = {
            sm: "h-10 px-6 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full",
            md: "h-14 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-full",
            lg: "h-20 px-14 text-sm font-black uppercase tracking-[0.3em] rounded-full",
            xl: "h-24 px-16 text-lg font-black uppercase tracking-[0.4em] rounded-full",
        };

        const MotionLink = motion(Link);
        const Component = href ? MotionLink : motion.button;

        return (
            <Component
                ref={ref}
                href={href as any}
                disabled={isLoading || (props as any).disabled}
                className={cn(
                    "relative inline-flex items-center justify-center border-2 transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sovereign-gold disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
                    variants[variant],
                    sizes[size],
                    className
                )}
                // "Ethical Motion" - No bounce, just smooth deliberate scale
                whileHover={!isLoading && !(props as any).disabled ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isLoading && !(props as any).disabled ? { scale: 0.98 } : {}}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }} // Slow ease-out
                {...props}
            >
                {/* Shimmer Effect for Primary Actions */}
                {variant === "primary" && withShimmer && !isLoading && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                )}

                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}

                <span className="relative z-20 flex items-center gap-3">
                    {children}
                </span>
            </Component>
        );
    }
);
SovereignButton.displayName = "SovereignButton";

export { SovereignButton };

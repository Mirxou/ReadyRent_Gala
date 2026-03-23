"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * SovereignButton - The Button of Authority.
 * 
 * Principles:
 * - Slow Motion: Deliberate actions (Money, Contracts).
 * - Solid State: No wobbly bouncy animations.
 * - Golden Standard: Primary action is always Sovereign Gold.
 */

interface SovereignButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg" | "xl";
    isLoading?: boolean;
    withShimmer?: boolean;
}

const SovereignButton = React.forwardRef<HTMLButtonElement, SovereignButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, withShimmer = false, children, ...props }, ref) => {

        // Variants for ethical timing
        const variants = {
            primary: "bg-sovereign-gold text-sovereign-blue border-sovereign-gold hover:bg-sovereign-gold/90 hover:scale-[1.02]",
            secondary: "bg-transparent border-sovereign-gold text-sovereign-gold hover:bg-sovereign-gold/10",
            danger: "bg-red-900/20 border-red-500 text-red-500 hover:bg-red-900/40",
            ghost: "bg-transparent border-transparent text-sovereign-gold hover:bg-sovereign-gold/5",
        };

        const sizes = {
            sm: "h-9 px-4 text-xs font-medium uppercase tracking-widest",
            md: "h-12 px-8 text-sm font-semibold uppercase tracking-widest",
            lg: "h-16 px-10 text-base font-bold uppercase tracking-[0.15em]",
            xl: "h-20 px-12 text-xl font-black uppercase tracking-[0.2em]",
        };

        return (
            <motion.button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "relative inline-flex items-center justify-center border-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sovereign-gold disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
                    variants[variant],
                    sizes[size],
                    className
                )}
                // "Ethical Motion" - No bounce, just smooth deliberate scale
                whileHover={!isLoading && !props.disabled ? { scale: 1.02 } : {}}
                whileTap={!isLoading && !props.disabled ? { scale: 0.98 } : {}}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} // Slow ease-out
                {...props}
            >
                {/* Shimmer Effect for Primary Actions */}
                {variant === "primary" && withShimmer && !isLoading && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                )}

                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}

                <span className="relative z-20 flex items-center gap-2">
                    {children}
                </span>
            </motion.button>
        );
    }
);
SovereignButton.displayName = "SovereignButton";

export { SovereignButton };

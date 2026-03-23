"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

/**
 * GlassPanel - The Container of Clarity.
 * 
 * Principles:
 * - Clear Boundaries: Solid 1px border. No vague blurs.
 * - Depth: Subtle shadow, high blur.
 * - Context: Adapts to Dark/Light mode automatically.
 */

interface GlassPanelProps extends HTMLMotionProps<"div"> {
    gradientBorder?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
    ({ className, children, gradientBorder = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                    "relative overflow-hidden rounded-xl backdrop-blur-xl",
                    // Light Mode: White tint, grey border
                    "bg-white/60 border border-gray-200 shadow-xl",
                    // Dark Mode: Navy tint, white border 
                    "dark:bg-sovereign-blue/40 dark:border-white/10 dark:shadow-2xl",
                    className
                )}
                {...props}
            >
                {/* Gradient Border Overlay (Optional) */}
                {gradientBorder && (
                    <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-sovereign-gold/50 via-transparent to-sovereign-blue/50 -z-10 mask-border" />
                )}

                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        );
    }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };

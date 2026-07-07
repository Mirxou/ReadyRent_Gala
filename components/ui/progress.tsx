"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // current value
  max?: number; // defaults to 100
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    const percent = max <= 0 ? 0 : (value / max) * 100;
    const clamped = Math.max(0, Math.min(100, percent));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-slate-200",
          "h-2",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";


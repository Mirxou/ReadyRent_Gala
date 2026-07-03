"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  value: string | undefined;
  setValue: (v: string) => void;
  name: string;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function RadioGroup({
  value,
  onValueChange,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const name = React.useId();
  const ctx = React.useMemo<RadioGroupContextValue>(
    () => ({
      value,
      setValue: (v) => onValueChange?.(v),
      name,
    }),
    [value, onValueChange, name]
  );

  return (
    <RadioGroupContext.Provider value={ctx}>
      <div role="radiogroup" className={className} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, className, id, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    const actualId = id ?? value;
    if (!ctx) {
      // Render a non-functional input if used outside of RadioGroup (should not happen).
      return (
        <input
          ref={ref}
          type="radio"
          id={actualId}
          name={actualId}
          value={value}
          className={className}
          {...props}
        />
      );
    }

    const checked = ctx.value === value;
    return (
      <input
        ref={ref}
        type="radio"
        id={actualId}
        name={ctx.name}
        value={value}
        checked={checked}
        onChange={() => ctx.setValue(value)}
        className={cn(className)}
        {...props}
      />
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";


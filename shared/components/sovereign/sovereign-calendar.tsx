'use client';

interface SovereignCalendarProps {
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
  className?: string;
}

export function SovereignCalendar({ onDateSelect, selectedDate, className = '' }: SovereignCalendarProps) {
  return (
    <input
      type="date"
      value={selectedDate || ''}
      onChange={(e) => onDateSelect?.(e.target.value)}
      className={`rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50 ${className}`}
    />
  );
}

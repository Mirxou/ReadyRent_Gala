'use client';

import { useState } from 'react';

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
      className={`rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50 ${className}`}
    />
  );
}

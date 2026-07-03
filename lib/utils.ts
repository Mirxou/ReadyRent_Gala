import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with space as thousands separator (Arabic/French convention).
 * Uses a deterministic approach to avoid hydration mismatches between
 * server (Node.js) and client (browser) locales.
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  const parts = Math.abs(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return n < 0 ? `-${parts}` : parts;
}

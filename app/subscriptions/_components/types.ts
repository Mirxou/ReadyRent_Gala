import { Shield, Star, Crown, Sparkles } from 'lucide-react';
import type { Variants } from 'framer-motion';

// ── Types ──
export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
  bookingsLimit: number | null;
}

export interface ActivePlanData {
  id: string;
  plan_id: string;
  name_ar: string;
  price: number;
  end_date: string | null;
  bookings_used: number;
  bookings_limit: number;
}

export interface SubscriptionHistory {
  id: string;
  date: string;
  plan: string;
  amount: number;
  status: 'مدفوع' | 'نشط' | 'ملغي';
}

// ── Icon mapping (keyed by plan_id: free, basic, premium, vip) ──
export const planIconMap: Record<string, React.ElementType> = {
  free: Shield,
  basic: Star,
  premium: Crown,
  vip: Sparkles,
};

export const planPopularSet = new Set(['premium']);

// ── Animation Variants ──
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── Helpers ──
export function formatRenewalDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function mapApiPlan(apiPlan: Record<string, unknown>): Plan {
  const id = apiPlan.id as string;
  const planId = (apiPlan.plan_id as string) || id;
  const bookingsLimit = apiPlan.bookings_limit as number;
  return {
    id,
    name: (apiPlan.name_ar as string) || id,
    price: (apiPlan.price as number) || 0,
    features: (apiPlan.features as string[]) || [],
    icon: planIconMap[planId] || Shield,
    popular: planPopularSet.has(planId),
    bookingsLimit: bookingsLimit === -1 ? null : bookingsLimit,
  };
}

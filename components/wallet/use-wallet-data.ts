'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import type { WalletTransaction, WalletBooking, WalletUserProfile, WalletBarChart } from './types';

async function fetchProfile(): Promise<WalletUserProfile | null> {
  const res = await fetch('/api/auth/profile');
  const json = await res.json();
  return json.data?.user || null;
}

async function fetchWallet(): Promise<{ balance: number; transactions: WalletTransaction[] } | null> {
  const res = await fetch('/api/wallet');
  const json = await res.json();
  return json.data || null;
}

async function fetchBookings(): Promise<WalletBooking[]> {
  const res = await fetch('/api/bookings');
  const json = await res.json();
  return json.data || [];
}

/**
 * Builds a 7-day mini bar chart from transactions matching the given type filter.
 */
function buildWeeklyBars(transactions: WalletTransaction[], typeFilter: string[]): WalletBarChart {
  const now = new Date();
  const weekKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const values = weekKeys.map(day =>
    transactions
      .filter(tx => (tx.date as string)?.startsWith(day) && typeFilter.includes(tx.type as string))
      .reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
  );

  const max = Math.max(...values, 1);
  return { values, max, normalized: values.map(v => v / max) };
}

export function useWalletData() {
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });

  const { data: activeBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['active-escrow'],
    queryFn: fetchBookings,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-history'],
    queryFn: async () => {
      const res = await paymentsApi.getAll();
      return res.data || [];
    },
  });

  const balance = walletData?.balance ?? userProfile?.wallet_balance ?? 0;
  const transactions = walletData?.transactions || [];

  const escrowBookings = (activeBookings || []).filter(
    (b: WalletBooking) => ['confirmed', 'active', 'pending'].includes(b.status as string)
  );

  const escrowAmount = escrowBookings.reduce(
    (acc, b) => acc + (Number(b.deposit_amount) || Number(b.total_price) || 0),
    0
  );

  const isLoading = userLoading || walletLoading || bookingsLoading;

  // Financial stats
  const totalExpenses = transactions
    .filter(tx => tx.type === 'EXPENDITURE' || tx.type === 'escrow_lock')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalReleased = transactions
    .filter(tx => tx.type === 'escrow_release' || tx.type === 'INCOME')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const expenseChart = buildWeeklyBars(transactions, ['EXPENDITURE', 'escrow_lock']);
  const releaseChart = buildWeeklyBars(transactions, ['escrow_release', 'INCOME']);

  // Trust discount
  const trustScoreVal = userProfile?.trust_score || 0;
  const trustDiscount =
    trustScoreVal >= 100 ? 25 : trustScoreVal >= 50 ? 15 : trustScoreVal >= 20 ? 5 : 0;

  return {
    balance,
    transactions,
    escrowBookings,
    escrowAmount,
    payments,
    userProfile,
    isLoading,
    paymentsLoading,
    totalExpenses,
    totalReleased,
    expenseChart,
    releaseChart,
    trustDiscount,
  };
}

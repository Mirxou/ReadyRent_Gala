'use client';

export interface EscrowState {
  status: 'holding' | 'released' | 'disputed';
  amount: number;
  currency: string;
}

interface EscrowTrackerProps {
  bookingId?: string;
  amount?: number;
  status?: string;
}

export function EscrowTracker({ amount, status: _status }: EscrowTrackerProps) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">الحساب الأمين</p>
      <p className="text-lg font-black text-sovereign-gold">{amount ? `${amount} د.ج` : '-- د.ج'}</p>
      <p className="text-[10px] text-emerald-500 mt-1">محمي</p>
    </div>
  );
}
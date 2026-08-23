'use client';

import { Lock } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import type { WalletBooking } from './types';

interface ActiveEscrowListProps {
  bookings: WalletBooking[];
}

export function ActiveEscrowList({ bookings }: ActiveEscrowListProps) {
  if (bookings.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black flex items-center gap-3">
          <Lock className="w-5 h-5 text-sovereign-gold" />
          الضمانات النشطة (Sovereign Escrow)
        </h3>
        <Badge variant="outline" className="border-white/5 opacity-40">صندوق الأمان</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map(b => (
          <GlassPanel key={b.id} className="p-6 border-white/5 hover:border-sovereign-gold/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Contract #{b.id}</p>
                <h4 className="font-bold text-sm tracking-tight">{b.product_name}</h4>
              </div>
              <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-0 text-[10px] font-black">HELD</Badge>
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[8px] text-muted-foreground uppercase">Escrow Value</p>
                <p className="text-lg font-black">{formatNumber(b.deposit_amount || b.total_price || 0)} DA</p>
              </div>
              {b.end_date && (
                <p className="text-[10px] text-muted-foreground">Release: {format(new Date(b.end_date), 'dd MMM')}</p>
              )}
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

'use client';

import { CreditCard, Loader2 } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { cn, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { WalletPayment } from './types';

interface PaymentsHistoryProps {
  payments: WalletPayment[];
  isLoading: boolean;
}

function getPaymentStatus(status: string) {
  switch (status) {
    case 'completed': return { label: 'مكتمل', cls: 'bg-emerald-500/10 text-emerald-500' };
    case 'failed': return { label: 'فشل', cls: 'bg-red-500/10 text-red-500' };
    case 'refunded': return { label: 'مسترجع', cls: 'bg-amber-500/10 text-amber-500' };
    case 'pending': return { label: 'معلّق', cls: 'bg-white/5 text-muted-foreground' };
    default: return { label: status, cls: 'bg-white/5 text-muted-foreground' };
  }
}

function getEscrowLabel(status: string) {
  if (status === 'held') return 'محفوظ';
  if (status === 'released') return 'مفكوك';
  return status;
}

export function PaymentsHistory({ payments, isLoading }: PaymentsHistoryProps) {
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-xl font-black flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-sovereign-gold" />
        سجل المدفوعات (Payments History)
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-sovereign-gold animate-spin" />
        </div>
      ) : payments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map(p => {
            const statusInfo = getPaymentStatus(p.status);
            return (
              <GlassPanel key={p.id} className="p-5 border-white/5 hover:border-sovereign-gold/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {format(new Date(p.created_at), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                  <Badge className={cn('border-0 text-[9px] font-black px-2 py-0.5', statusInfo.cls)}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xl font-black tracking-tighter text-foreground">
                      {formatNumber(p.amount)} <span className="text-xs font-normal opacity-40">DA</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                      {p.method || '—'}
                    </p>
                  </div>
                  {p.escrow_status && (
                    <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold text-[9px] font-black">
                      {getEscrowLabel(p.escrow_status)}
                    </Badge>
                  )}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
          <CreditCard className="w-12 h-12 text-muted-foreground/10" />
          <p className="text-sm text-muted-foreground font-light uppercase tracking-widest opacity-40">لا توجد مدفوعات بعد</p>
        </div>
      )}
    </div>
  );
}

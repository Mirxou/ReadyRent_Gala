'use client';

import { Lock, Unlock, Undo2, Clock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface EscrowTrackerProps {
  bookingId?: string;
  amount?: number;
  status?: string;
  canRelease?: boolean;
  onRelease?: () => void;
  releasing?: boolean;
}

const escrowConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  none: {
    label: 'لم يبدأ',
    color: 'text-white/30',
    bgColor: 'bg-white/[0.02]',
    borderColor: 'border-white/5',
    icon: Clock,
  },
  held: {
    label: 'محتجز بأمان',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    icon: Lock,
  },
  released: {
    label: 'تم التحرير',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    icon: Unlock,
  },
  refunded: {
    label: 'تم الاسترداد',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/5',
    borderColor: 'border-sky-500/20',
    icon: Undo2,
  },
};

export function EscrowTracker({
  amount,
  status = 'none',
  canRelease: _canRelease,
  onRelease: _onRelease,
  releasing: _releasing,
}: EscrowTrackerProps) {
  const config = escrowConfig[status] || escrowConfig.none;
  const Icon = config.icon;

  return (
    <div className={`p-6 rounded-2xl border ${config.borderColor} ${config.bgColor} transition-all`}>
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
        الحساب الأمين (Escrow)
      </p>

      <div className="flex items-center justify-between mb-4">
        <p className={`text-2xl font-black ${config.color}`}>
          {amount ? `${formatNumber(amount)} د.ج` : '-- د.ج'}
        </p>
        <div className={`p-2 rounded-xl ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'held' ? 'bg-amber-400 animate-pulse' : status === 'released' ? 'bg-emerald-400' : status === 'refunded' ? 'bg-sky-400' : 'bg-white/20'}`} />
        <p className={`text-sm font-bold ${config.color}`}>{config.label}</p>
      </div>

      {status === 'held' && (
        <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
          المبلغ محتجز حتى تؤكد استلام المنتج.
          لن يُرسل للمؤجر إلا بعد تأكيدك.
        </p>
      )}
      {status === 'released' && (
        <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
          تم تحرير المبلغ للمؤجر.
          التحويل البنكي خلال 48 ساعة.
        </p>
      )}
      {status === 'refunded' && (
        <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
          تم استرداد المبلغ.
          سيتم التحويل خلال 15 يوم كحد أقصى (مادة 22 قانون 18-05).
        </p>
      )}
    </div>
  );
}

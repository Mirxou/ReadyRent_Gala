'use client';

import { CheckCircle2, Clock, AlertTriangle, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stage {
  label: string;
  status: string;
  date?: string;
}

interface JusticeReceiptProps {
  children?: React.ReactNode;
  className?: string;
  stages?: Stage[];
  disputeId?: string;
  finalVerdict?: string;
}

export function JusticeReceipt({ children, className = '', stages, disputeId, finalVerdict }: JusticeReceiptProps) {
  // If no stages, just render as wrapper
  if (!stages || stages.length === 0) {
    return (
      <div className={cn('border border-dashed border-white/10 rounded-xl p-4', className)}>
        {children}
      </div>
    );
  }

  const statusIcon = (status: string) => {
    if (status === 'completed' || status === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (status === 'pending' || status === 'in_progress') return <Clock className="h-4 w-4 text-yellow-400" />;
    if (status === 'rejected' || status === 'failed') return <AlertTriangle className="h-4 w-4 text-red-400" />;
    return <Gavel className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className={cn('border border-dashed border-white/10 rounded-xl p-6 space-y-4', className)}>
      {disputeId && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">إيصال العدالة</span>
          <span className="text-[10px] font-mono text-muted-foreground/60">{disputeId}</span>
        </div>
      )}

      <div className="space-y-3">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5">{statusIcon(stage.status)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{stage.label}</p>
              {stage.date && <p className="text-[10px] text-muted-foreground">{stage.date}</p>}
            </div>
          </div>
        ))}
      </div>

      {finalVerdict && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-sovereign-gold font-medium">{finalVerdict}</p>
        </div>
      )}

      {children}
    </div>
  );
}
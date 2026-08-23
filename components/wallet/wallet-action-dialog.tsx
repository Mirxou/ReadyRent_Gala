'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { formatNumber } from '@/lib/utils';

interface WalletActionDialogProps {
  mode: 'deposit' | 'withdraw';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance?: number;
  isProcessing: boolean;
  onProcess: (amount: number) => Promise<void>;
}

const PRESETS: Record<'deposit' | 'withdraw', number[]> = {
  deposit: [1000, 5000, 10000],
  withdraw: [],
};

export function WalletActionDialog({
  mode,
  open,
  onOpenChange,
  balance,
  isProcessing,
  onProcess,
}: WalletActionDialogProps) {
  const [amount, setAmount] = useState('');

  const handleOpen = (nextOpen: boolean) => {
    if (!nextOpen) setAmount('');
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    onProcess(val);
  };

  const title = mode === 'deposit' ? 'شحن المحفظة' : 'سحب من المحفظة';
  const btnLabel = mode === 'deposit'
    ? `شحن ${amount ? formatNumber(Number(amount)) : '...'} دج`
    : `سحب ${amount ? formatNumber(Number(amount)) : '...'} دج`;
  const presets = PRESETS[mode];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-background border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground text-right">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {mode === 'withdraw' && balance != null ? `المبلغ (د.ج) — الرصيد: ${formatNumber(balance)} دج` : 'المبلغ (د.ج)'}
            </Label>
            <Input
              type="number"
              min="1"
              max={mode === 'deposit' ? 100000 : balance}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="5000"
              className="text-2xl font-black h-14"
              dir="ltr"
            />
            {mode === 'deposit' && (
              <p className="text-[10px] text-muted-foreground/60">الحد الأقصى للعملية: 100,000 دج</p>
            )}
          </div>
          {presets.length > 0 && (
            <div className="flex gap-3">
              {presets.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-colors"
                >
                  {formatNumber(v)}
                </button>
              ))}
            </div>
          )}
          <SovereignButton variant="primary" className="w-full h-12" onClick={handleSubmit} disabled={isProcessing} withShimmer>
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : btnLabel}
          </SovereignButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

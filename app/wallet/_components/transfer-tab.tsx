'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';
import { walletApi } from '@/lib/api';

interface TransferTabProps {
  balance: number;
  onBalanceUpdate: (updater: (prev: number) => number) => void;
}

export function TransferTab({ balance, onBalanceUpdate }: TransferTabProps) {
  const [trRecipient, setTrRecipient] = useState('');
  const [trAmount, setTrAmount] = useState('');
  const [trNote, setTrNote] = useState('');
  const [trLoading, setTrLoading] = useState(false);

  const handleTransfer = useCallback(async () => {
    const amount = parseFloat(trAmount);
    if (!trRecipient.trim()) { toast.error('يرجى إدخال رقم المستلم'); return; }
    if (!amount || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
    if (amount > balance) { toast.error('المبلغ يتجاوز الرصيد المتاح'); return; }
    setTrLoading(true);
    try {
      const res = await walletApi.transfer(amount, trRecipient);
      if (res.status === 'sovereign_halt') { toast.error(res.message_en || 'فشل التحويل'); return; }
      if (res.data?.balance !== undefined) onBalanceUpdate(() => res.data.balance!);
      else onBalanceUpdate(prev => prev - amount);
      toast.success('تم التحويل بنجاح');
      setTrRecipient(''); setTrAmount(''); setTrNote('');
    } catch { toast.error('حدث خطأ أثناء التحويل'); }
    finally { setTrLoading(false); }
  }, [trRecipient, trAmount, balance, onBalanceUpdate]);

  return (
    <motion.div
      key="transfer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <GlassPanel className="p-8 md:p-10 rounded-[2.5rem] space-y-8" variant="obsidian" gradientBorder>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-4">
            <Send className="w-8 h-8 text-sovereign-gold" />
            تحويل <span className="text-sovereign-gold">الأموال.</span>
          </h2>
          <p className="text-sm text-muted-foreground font-light">
            الرصيد المتاح: <span className="text-sovereign-gold font-black">{formatNumber(balance)} دج</span>
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">رقم المستلم (هاتف أو بريد إلكتروني)</Label>
          <Input type="text" placeholder="0555 XXX XXX أو email@example.com" value={trRecipient} onChange={(e) => setTrRecipient(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl text-base text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" />
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">المبلغ (دج)</Label>
          <Input type="number" placeholder="0" value={trAmount} onChange={(e) => setTrAmount(e.target.value)} className="h-16 text-2xl font-black font-mono bg-white/5 border-white/10 rounded-2xl text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" />
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">ملاحظة (اختياري)</Label>
          <Input type="text" placeholder="سبب التحويل..." value={trNote} onChange={(e) => setTrNote(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl text-base text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" />
        </div>

        <SovereignButton variant="primary" size="lg" className="w-full" isLoading={trLoading} onClick={handleTransfer}>
          إرسال الأموال
        </SovereignButton>
      </GlassPanel>
    </motion.div>
  );
}

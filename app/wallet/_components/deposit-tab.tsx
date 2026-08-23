'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Smartphone, CreditCard, Zap } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';
import type { DepositMode } from './types';

interface DepositTabProps {
  balance: number;
  onBalanceUpdate: (updater: (prev: number) => number) => void;
}

export function DepositTab({ balance, onBalanceUpdate }: DepositTabProps) {
  const [depositMode, setDepositMode] = useState<DepositMode>('deposit');
  const [dwAmount, setDwAmount] = useState('');
  const [dwMethod, setDwMethod] = useState<'baridimob' | 'bankcard'>('baridimob');
  const [dwRipNumber, setDwRipNumber] = useState('');
  const [dwCardNumber, setDwCardNumber] = useState('');
  const [dwExpiry, setDwExpiry] = useState('');
  const [dwCvv, setDwCvv] = useState('');
  const [dwLoading, setDwLoading] = useState(false);

  const resetForm = useCallback(() => {
    setDwAmount('');
    setDwRipNumber('');
    setDwCardNumber('');
    setDwExpiry('');
    setDwCvv('');
    setDwMethod('baridimob');
  }, []);

  const handleDeposit = useCallback(async () => {
    const amount = parseFloat(dwAmount);
    if (!amount || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
    setDwLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method: dwMethod }) });
      const json = await res.json();
      if (res.ok) {
        if (json?.data?.balance !== undefined) onBalanceUpdate(() => json.data.balance);
        else onBalanceUpdate(prev => prev + amount);
        toast.success('تم الإيداع بنجاح');
        resetForm();
      } else { toast.error(json?.error || 'فشل الإيداع'); }
    } catch { toast.error('حدث خطأ أثناء الإيداع'); }
    finally { setDwLoading(false); }
  }, [dwAmount, dwMethod, resetForm, onBalanceUpdate]);

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(dwAmount);
    if (!amount || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
    if (amount > balance) { toast.error('المبلغ يتجاوز الرصيد المتاح'); return; }
    setDwLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method: dwMethod }) });
      const json = await res.json();
      if (res.ok) {
        if (json?.data?.balance !== undefined) onBalanceUpdate(() => json.data.balance);
        else onBalanceUpdate(prev => prev - amount);
        toast.success('تم السحب بنجاح');
        resetForm();
      } else { toast.error(json?.error || 'فشل السحب'); }
    } catch { toast.error('حدث خطأ أثناء السحب'); }
    finally { setDwLoading(false); }
  }, [dwAmount, balance, dwMethod, resetForm, onBalanceUpdate]);

  return (
    <motion.div
      key="deposit"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex gap-3">
        {([['deposit', ArrowDownLeft, 'إيداع'], ['withdraw', ArrowUpRight, 'سحب']] as const).map(([mode, Icon, label]) => (
          <button
            key={mode}
            onClick={() => setDepositMode(mode)}
            className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all duration-500 ${
              depositMode === mode ? 'border-sovereign-gold bg-sovereign-gold/10 text-sovereign-gold' : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-white/60'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-widest">{label}</span>
          </button>
        ))}
      </div>

      <GlassPanel className="p-8 md:p-10 rounded-[2.5rem] space-y-8" variant="obsidian" gradientBorder>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-4">
            {depositMode === 'deposit' ? (
              <><ArrowDownLeft className="w-8 h-8 text-emerald-500" /> إيداع <span className="text-sovereign-gold">سيادي.</span></>
            ) : (
              <><ArrowUpRight className="w-8 h-8 text-red-400" /> سحب <span className="text-sovereign-gold">الأصول.</span></>
            )}
          </h2>
          {depositMode === 'withdraw' && (
            <p className="text-sm text-muted-foreground font-light">
              الرصيد المتاح: <span className="text-sovereign-gold font-black">{formatNumber(balance)} دج</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">المبلغ (دج)</Label>
          <Input type="number" placeholder="0" value={dwAmount} onChange={(e) => setDwAmount(e.target.value)} className="h-16 text-2xl font-black font-mono bg-white/5 border-white/10 rounded-2xl text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" />
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">طريقة الدفع</Label>
          <Select value={dwMethod} onValueChange={(v) => setDwMethod(v as 'baridimob' | 'bankcard')}>
            <SelectTrigger className="w-full h-14 bg-white/5 border-white/10 rounded-2xl text-base font-bold focus:ring-sovereign-gold/20 focus:border-sovereign-gold data-[placeholder]:text-white/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-sovereign-black border-sovereign-gold/20 rounded-2xl">
              <SelectItem value="baridimob" className="text-base py-3 focus:bg-sovereign-gold/10 focus:text-sovereign-gold">
                <span className="flex items-center gap-3"><Smartphone className="w-4 h-4" /> البريدي موب (BaridiMob)</span>
              </SelectItem>
              <SelectItem value="bankcard" className="text-base py-3 focus:bg-sovereign-gold/10 focus:text-sovereign-gold">
                <span className="flex items-center gap-3"><CreditCard className="w-4 h-4" /> بطاقة بنكية</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence mode="wait">
          {dwMethod === 'baridimob' ? (
            <motion.div key="baridimob" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">الرقم RIP</Label>
                <Input type="text" placeholder="007999XXXXXXXXXX" value={dwRipNumber} onChange={(e) => setDwRipNumber(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-sovereign-gold/5 border border-sovereign-gold/10 rounded-2xl">
                <Zap className="w-5 h-5 text-sovereign-gold shrink-0" />
                <span className="text-sm text-sovereign-gold/80 font-light">سيتم إرسال رمز تأكيد إلى رقمك المسجل في البريدي موب</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="bankcard" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">رقم البطاقة</Label>
                <Input type="text" placeholder="**** **** **** ****" value={dwCardNumber} onChange={(e) => setDwCardNumber(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-center tracking-[0.3em] focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">تاريخ الانتهاء</Label>
                  <Input type="text" placeholder="MM/YY" value={dwExpiry} onChange={(e) => setDwExpiry(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-center focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" maxLength={5} />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">CVV</Label>
                  <Input type="password" placeholder="***" value={dwCvv} onChange={(e) => setDwCvv(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-center focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10" dir="ltr" maxLength={4} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SovereignButton variant="primary" size="lg" className="w-full" isLoading={dwLoading} onClick={depositMode === 'deposit' ? handleDeposit : handleWithdraw}>
          {depositMode === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
        </SovereignButton>
      </GlassPanel>
    </motion.div>
  );
}
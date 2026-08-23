'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Lock, History } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { cn, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { WalletTransaction } from './types';

interface TransactionLedgerProps {
  transactions: WalletTransaction[];
}

function getTxIcon(type: string) {
  if (type === 'INCOME' || type === 'deposit') return <ArrowUpRight className="w-5 h-5" />;
  if (type === 'ESCROW_HELD' || type === 'escrow_lock') return <Lock className="w-4 h-4" />;
  return <ArrowDownLeft className="w-5 h-5" />;
}

function getTxColor(type: string) {
  if (type === 'INCOME' || type === 'deposit') return 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500';
  if (type === 'ESCROW_HELD' || type === 'escrow_lock') return 'bg-sovereign-gold/5 border-sovereign-gold/20 text-sovereign-gold';
  if (type === 'penalty' || type === 'EXPENDITURE') return 'bg-red-500/5 border-red-500/20 text-red-500';
  return 'bg-white/5 border-white/10 text-muted-foreground';
}

function isPositive(type: string) {
  return type === 'INCOME' || type === 'deposit' || type === 'escrow_release';
}

function getTxLabel(type: string, note?: string) {
  if (note) return note;
  if (type === 'escrow_lock') return 'تأمين ضمان سيادي';
  if (type === 'escrow_release') return 'فك رهن الضمان';
  return 'معاملة مالية';
}

export function TransactionLedger({ transactions }: TransactionLedgerProps) {
  return (
    <div className="space-y-6 pt-8">
      <h3 className="text-xl font-black flex items-center gap-3">
        <History className="w-5 h-5 text-sovereign-gold" />
        مدونة المعاملات السيادية (Audit Ledger)
      </h3>

      <div className="space-y-3">
        {transactions.length > 0 ? (
          transactions.map(tx => (
            <motion.div key={tx.id} whileHover={{ x: -4 }}>
              <GlassPanel className="p-5 flex items-center justify-between hover:border-white/10 transition-all border-white/5 group">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors',
                    getTxColor(tx.type)
                  )}>
                    {getTxIcon(tx.type)}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-foreground group-hover:text-sovereign-gold transition-colors">
                      {getTxLabel(tx.type, tx.note)}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-40">
                      <span>#{tx.id}</span>
                      {tx.hash && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{tx.hash}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <p className={cn(
                    'text-xl font-black tracking-tighter',
                    isPositive(tx.type) ? 'text-emerald-500' : 'text-foreground'
                  )}>
                    {isPositive(tx.type) ? '+' : '-'}{formatNumber(tx.amount)} <span className="text-xs font-normal opacity-40">DA</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground opacity-60">
                    {format(new Date(tx.date), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
              </GlassPanel>
            </motion.div>
          ))
        ) : (
          <div className="p-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
            <History className="w-12 h-12 text-muted-foreground/10" />
            <p className="text-sm text-muted-foreground font-light uppercase tracking-widest opacity-40">لا توجد معاملات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}

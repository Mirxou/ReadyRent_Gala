'use client';

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface SovereignLedgerProps {
  transactions?: Array<{
    id: string;
    type: string;
    amount: number;
    note?: string;
    createdAt: string;
  }>;
}

export function SovereignLedger({ transactions = [] }: SovereignLedgerProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">لا توجد معاملات بعد</p>;
  }
  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div className="flex items-center gap-2">
            {tx.type.includes('INCOME') || tx.type.includes('DEPOSIT') || tx.type.includes('RELEASED') ? (
              <ArrowDownLeft className="h-4 w-4 text-green-400" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-red-400" />
            )}
            <div>
              <p className="text-sm">{tx.note || tx.type}</p>
              <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('ar-DZ')}</p>
            </div>
          </div>
          <span className={`font-bold text-sm ${tx.type.includes('INCOME') || tx.type.includes('DEPOSIT') || tx.type.includes('RELEASED') ? 'text-green-400' : 'text-red-400'}`}>
            {tx.type.includes('INCOME') || tx.type.includes('DEPOSIT') || tx.type.includes('RELEASED') ? '+' : '-'}{tx.amount.toLocaleString()} دج
          </span>
        </div>
      ))}
    </div>
  );
}

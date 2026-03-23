'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldEllipsis
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/lib/api/wallet';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1"><CheckCircle2 size={12}/> مكتملة</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1"><Clock size={12}/> معلقة</Badge>;
      case 'disputed':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle size={12}/> تحت النزاع</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    if (type === 'deposit' || type === 'escrow_release') {
      return <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ArrowDownLeft size={18} /></div>;
    }
    return <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><ArrowUpRight size={18} /></div>;
  };

  return (
    <Card className="p-0 overflow-hidden border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4" dir="rtl">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldEllipsis className="text-indigo-600" />
          سجل العمليات المالية
        </h3>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="بحث في العمليات..." className="pr-10 rounded-xl" />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl"><Filter size={18}/></Button>
          <Button variant="outline" size="icon" className="rounded-xl"><Download size={18}/></Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right" dir="rtl">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/30">
              <th className="px-6 py-4 font-medium">العملية / الوصف</th>
              <th className="px-6 py-4 font-medium text-center">الحالة</th>
              <th className="px-6 py-4 font-medium">التاريخ</th>
              <th className="px-6 py-4 font-medium text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx, idx) => (
              <motion.tr 
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(tx.type)}
                    <div>
                      <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{tx.description}</p>
                      <p className="text-xs text-slate-400 font-mono">{tx.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {getStatusBadge(tx.status)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600">{new Date(tx.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                </td>
                <td className="px-6 py-4 text-left">
                  <p className={`font-black text-base ${
                    tx.type === 'deposit' || tx.type === 'escrow_release' ? 'text-green-600' : 'text-slate-900'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'escrow_release' ? '+' : '-'}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">SAR</p>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex justify-center">
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">تحميل المزيد من العمليات</Button>
      </div>
    </Card>
  );
};

'use client'
import { formatNumber } from '@/lib/utils';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Unlock, 
  History, 
  Plus, 
  CreditCard,
  Target,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { walletApi, WalletBalance, Transaction } from '@/lib/api/wallet';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { toast } from 'sonner';


export const WalletDashboard = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({ limit: 5 })
      ]);
      if (balanceRes.data) setBalance(balanceRes.data);
      if (transactionsRes.data) setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
    } catch (error) {
      toast.error('تعذر تحميل بيانات المحفظة');
    } finally {
      setLoading(false);
    }
  };

  const dashboardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (loading || !balance) {
    return (
      <div className="space-y-8 animate-pulse p-6">
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate real stats from transaction data
  const escrowCount = transactions.filter(t => t.type === 'escrow_hold' && t.status === 'pending').length;
  const totalIncome = transactions.filter(t => t.type === 'deposit' || t.type === 'escrow_release').reduce((sum, t) => sum + t.amount, 0);

  return (
    <motion.div 
      className="max-w-5xl mx-auto p-6 space-y-8 pb-24"
      initial="hidden"
      animate="visible"
      variants={dashboardVariants}
    >
      {/* Header */}
      <div className="flex justify-between items-center" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">المحفظة السيادية</h1>
          <p className="text-slate-500 mt-1">إدارة أموالك وتتبع ضماناتك في مكان واحد</p>
        </div>
        <Button size="lg" className="rounded-2xl gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
          <Plus size={20} />
          شحن الرصيد
        </Button>
      </div>

      {/* Main Balance Card */}
      <Card className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-[2rem] border-none shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <Wallet size={16} /> إجمالي الرصيد (دينار جزائري)
            </p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight flex items-baseline gap-2">
              {formatNumber(balance.total)}
              <span className="text-2xl font-normal text-slate-400">د.ج</span>
            </h2>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-xs text-slate-300 mb-1">المعاملات</p>
              <p className="text-xl font-bold text-emerald-400">{transactions.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-xs text-slate-300 mb-1">الإيرادات</p>
              <p className="text-xl font-bold flex items-center justify-center gap-1">
                <TrendingUp size={16} className="text-emerald-400" />
                {formatNumber(totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-600/30 p-4 rounded-2xl border border-emerald-400/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-400/20 rounded-lg">
                <Unlock size={20} />
              </div>
              <span className="text-sm font-medium">متاح للسحب</span>
            </div>
            <span className="text-lg font-bold">{formatNumber(balance.available)} د.ج</span>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg">
                <Lock size={20} className="text-amber-400" />
              </div>
              <span className="text-sm font-medium">محجوز في الضمان (Escrow)</span>
            </div>
            <span className="text-lg font-bold text-amber-400">{formatNumber(balance.escrow)} د.ج</span>
          </div>
        </div>
      </Card>

      {/* Secondary Stats & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 border-slate-100 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={18} />
              حالة الضمان
            </h3>
            <Badge variant="outline" className="text-emerald-600">
              {escrowCount > 0 ? `${escrowCount} نشط` : 'لا يوجد'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500" dir="rtl">
            {escrowCount > 0 
              ? `لديك ${escrowCount} عقد في مرحلة الضمان المالي.`
              : 'لا توجد عقود في مرحلة الضمان حالياً.'}
          </p>
          <Progress value={escrowCount > 0 ? Math.min(100, 50 + escrowCount * 10) : 0} className="h-2" />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{escrowCount > 0 ? 'بانتظار التحرير' : 'مكتمل'}</span>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-slate-100 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Target className="text-emerald-600" size={18} />
              المعاملات المنجزة
            </h3>
          </div>
          <p className="text-sm text-slate-500" dir="rtl">إجمالي معاملاتك المنجزة.</p>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
             <div className="absolute inset-0 bg-emerald-500 w-full" />
          </div>
          <p className="text-lg font-bold text-emerald-600">{transactions.length} معاملة</p>
        </Card>

        <Card className="p-6 space-y-4 border-slate-100 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <CreditCard className="text-slate-900" size={18} />
              طرق الدفع
            </h3>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
             <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-[8px] font-bold">CIB</div>
             <div className="flex-1">
               <p className="text-xs font-bold text-slate-900">Chargily Pay</p>
               <p className="text-[10px] text-slate-500">CIB + Edahabia</p>
             </div>
             <ChevronRight size={14} className="text-slate-400" />
          </div>
          <Button variant="outline" size="sm" className="w-full">إدارة طرق الدفع</Button>
        </Card>
      </div>

      {/* Recent Transactions */}
      <TransactionHistory transactions={transactions} />
    </motion.div>
  );
};

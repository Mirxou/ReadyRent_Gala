'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      const [balanceData, transactionsData] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(5)
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData);
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
        <Button size="lg" className="rounded-2xl gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
          <Plus size={20} />
          شحن الرصيد
        </Button>
      </div>

      {/* Main Balance Card */}
      <Card className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-[2rem] border-none shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <Wallet size={16} /> إجمالي الرصيد (ريال سعودي)
            </p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight flex items-baseline gap-2">
              {balance.total.toLocaleString()}
              <span className="text-2xl font-normal text-slate-400">SAR</span>
            </h2>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-xs text-slate-300 mb-1">نسبة الأمان</p>
              <p className="text-xl font-bold text-green-400">99.8%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-xs text-slate-300 mb-1">النمو الشهري</p>
              <p className="text-xl font-bold flex items-center justify-center gap-1">
                <TrendingUp size={16} className="text-indigo-400" />
                12%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-600/30 p-4 rounded-2xl border border-indigo-400/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-400/20 rounded-lg">
                <Unlock size={20} />
              </div>
              <span className="text-sm font-medium">متاح للسحب</span>
            </div>
            <span className="text-lg font-bold">{balance.available.toLocaleString()} SAR</span>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg">
                <Lock size={20} className="text-amber-400" />
              </div>
              <span className="text-sm font-medium">محجوز في الضمان (Escrow)</span>
            </div>
            <span className="text-lg font-bold text-amber-400">{balance.escrow.toLocaleString()} SAR</span>
          </div>
        </div>
      </Card>

      {/* Secondary Stats & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 border-slate-100 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldCheck className="text-green-600" size={18} />
              حالة الضمان
            </h3>
            <Badge variant="outline" className="text-green-600">نشط</Badge>
          </div>
          <p className="text-sm text-slate-500" dir="rtl">لديك 3 عقود في مرحلة الضمان المالي.</p>
          <Progress value={60} className="h-2" />
          <div className="flex justify-between text-xs text-slate-400">
            <span>مكتمل 60%</span>
            <span>انتظار الفك</span>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-slate-100 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Target className="text-indigo-600" size={18} />
              الأهداف المالية
            </h3>
          </div>
          <p className="text-sm text-slate-500" dir="rtl">ادخرت 12,000 ريال من هدف 20,000 ريال.</p>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
             <div className="absolute inset-0 bg-indigo-500 w-[60%]" />
          </div>
          <Button variant="ghost" size="sm" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">تعديل الأهداف</Button>
        </Card>

        <Card className="p-6 space-y-4 border-slate-100 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <CreditCard className="text-slate-900" size={18} />
              طرق الدفع
            </h3>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
             <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
             <div className="flex-1">
               <p className="text-xs font-bold text-slate-900">Visa **** 4422</p>
               <p className="text-[10px] text-slate-500">الافتراضية</p>
             </div>
             <ChevronRight size={14} className="text-slate-400" />
          </div>
          <Button variant="outline" size="sm" className="w-full">إضافة بطاقة</Button>
        </Card>
      </div>

      {/* Recent Transactions */}
      <TransactionHistory transactions={transactions} />
    </motion.div>
  );
};

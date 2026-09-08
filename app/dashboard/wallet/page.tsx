'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { walletApi } from '@/lib/api';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import {
  WalletLoading,
  BalanceOverview,
  ActiveEscrowList,
  TransactionLedger,
  TrustSidebar,
  PaymentsHistory,
  WalletActionDialog,
  useWalletData,
} from '@/components/wallet';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    balance,
    transactions,
    escrowBookings,
    escrowAmount,
    payments,
    userProfile,
    isLoading,
    paymentsLoading,
    totalExpenses,
    totalReleased,
    expenseChart,
    releaseChart,
    trustDiscount,
  } = useWalletData();

  if (isLoading) return <WalletLoading />;

  const invalidateWalletQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['payments-history'] });
  };

  const processDeposit = async (val: number) => {
    if (val > 100000) { toast.error('الحد الأقصى للعملية الواحدة: 100,000 دج'); return; }
    setIsProcessing(true);
    try {
      const res = await walletApi.topUp(val, '');
      if (res.status === 'sovereign_halt') {
        toast.error(res.message_en || 'فشلت العملية');
      } else {
        toast.success(`تم شحن ${formatNumber(val)} دج بنجاح`);
        setDepositOpen(false);
        invalidateWalletQueries();
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithdraw = async (val: number) => {
    if (val > balance) { toast.error('رصيد غير كافٍ'); return; }
    setIsProcessing(true);
    try {
      const res = await walletApi.withdraw(val);
      if (res.status === 'sovereign_halt') {
        toast.error(res.message_en === 'Insufficient wallet balance' ? 'رصيد غير كافٍ' : (res.message_en || 'فشلت العملية'));
      } else {
        toast.success(`تم سحب ${formatNumber(val)} دج بنجاح`);
        setWithdrawOpen(false);
        invalidateWalletQueries();
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20 bg-background text-right px-6" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[140px] opacity-40" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-sovereign-gold/5 rounded-full blur-[140px] opacity-30" />
      </div>

      <div className="container mx-auto max-w-6xl py-12 relative z-10">
        <header className="mb-12 flex items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
               Financial Sovereignty
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter text-foreground">الرصيد السيادي<span className="text-sovereign-gold">.</span></h1>
            <p className="text-muted-foreground font-light italic">إدارة الأصول والضمانات البنكية للمجتمع النخبة.</p>
          </div>
          <SovereignButton variant="secondary" size="sm" className="hidden md:flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث السجل
          </SovereignButton>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <BalanceOverview
              balance={balance}
              escrowAmount={escrowAmount}
              onDeposit={() => setDepositOpen(true)}
              onWithdraw={() => setWithdrawOpen(true)}
            />

            <ActiveEscrowList bookings={escrowBookings} />

            <TransactionLedger transactions={transactions} />
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4">
            <TrustSidebar
              userProfile={userProfile}
              trustDiscount={trustDiscount}
              totalExpenses={totalExpenses}
              totalReleased={totalReleased}
              expenseChart={expenseChart}
              releaseChart={releaseChart}
            />
          </div>
        </div>

        {/* Payments History */}
        <div className="lg:col-span-12">
          <PaymentsHistory payments={payments} isLoading={paymentsLoading} />
        </div>
      </div>

      <WalletActionDialog
        mode="deposit"
        open={depositOpen}
        onOpenChange={setDepositOpen}
        isProcessing={isProcessing}
        onProcess={processDeposit}
      />

      <WalletActionDialog
        mode="withdraw"
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={balance}
        isProcessing={isProcessing}
        onProcess={processWithdraw}
      />
    </div>
  );
}

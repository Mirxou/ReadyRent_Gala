'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  Unlock,
  Undo2,
  Receipt,
  Landmark,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { paymentsApi } from '@/lib/api';
import { type PaymentItem } from './types';

// ═══════════════════════════════════════════════════════════════
// PaymentsTab — MASTERPLAN 3.5: surfaced the existing
// GET /api/payments/payments (Payment model list: amount, method,
// status, escrow_status) that previously had no UI anywhere.
// ═══════════════════════════════════════════════════════════════

const STATUS_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  completed: { label: 'مكتملة', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  pending: { label: 'قيد المعالجة', className: 'bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20', icon: Clock },
  processing: { label: 'قيد المعالجة', className: 'bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20', icon: Clock },
  failed: { label: 'فاشلة', className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  cancelled: { label: 'ملغاة', className: 'bg-white/5 text-white/40 border-white/10', icon: XCircle },
};

const ESCROW_META: Record<string, { label: string; icon: React.ElementType }> = {
  held: { label: 'محجوز في الخزنة', icon: Lock },
  released: { label: 'مُفرج عنه', icon: Unlock },
  refunded: { label: 'مسترجع', icon: Undo2 },
};

const METHOD_META: Record<string, { label: string; icon: React.ElementType }> = {
  card: { label: 'بطاقة بنكية', icon: CreditCard },
  chargily: { label: 'بطاقة بنكية (Chargily)', icon: CreditCard },
  edahabia: { label: 'بطاقة الذهبية', icon: CreditCard },
  baridimob: { label: 'بريدي موب', icon: Smartphone },
  bank_transfer: { label: 'تحويل بنكي', icon: Landmark },
  wallet: { label: 'المحفظة السيادية', icon: Wallet },
};

function paymentDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const httpStatus = (res as { httpStatus?: number }).httpStatus;
        if (res.status === 'sovereign_halt' || (httpStatus && httpStatus >= 400)) {
          setFailed(true);
          return;
        }
        const rows = (res.data as PaymentItem[] | null) ?? [];
        setPayments(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <motion.div key="payments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-sovereign-gold/20 border-t-sovereign-gold rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="payments"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end border-b border-white/5 pb-4">
        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-4">
          سجل <span className="text-sovereign-gold">المدفوعات.</span>
        </h2>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline">
          كل عمليات الدفع المرتبطة بحجوزاتك
        </span>
      </div>

      {failed ? (
        <GlassPanel className="p-12 text-center rounded-3xl" variant="obsidian" gradientBorder>
          <XCircle className="w-12 h-12 text-red-500/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">تعذّر تحميل سجل المدفوعات — تحقق من اتصالك وحاول لاحقاً</p>
        </GlassPanel>
      ) : payments.length === 0 ? (
        <GlassPanel className="p-12 text-center rounded-3xl" variant="obsidian" gradientBorder>
          <Receipt className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground/60 text-sm">لا توجد مدفوعات بعد — ستظهر هنا فور إتمام أول عملية دفع</p>
        </GlassPanel>
      ) : (
        <div
          className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(197,160,89,0.2) transparent' }}
        >
          {payments.map((payment) => {
            const statusMeta = STATUS_META[payment.status] ?? {
              label: payment.status,
              className: 'bg-white/5 text-white/60 border-white/10',
              icon: Receipt,
            };
            const StatusIcon = statusMeta.icon;
            const methodMeta = METHOD_META[payment.method] ?? { label: payment.method, icon: CreditCard };
            const MethodIcon = methodMeta.icon;
            const escrowMeta = payment.escrow_status ? ESCROW_META[payment.escrow_status] : null;
            const EscrowIcon = escrowMeta?.icon ?? Lock;

            return (
              <motion.div key={payment.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
                <GlassPanel
                  className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 group-hover:bg-white/[0.02] transition-colors rounded-3xl"
                  gradientBorder
                >
                  <div className="flex gap-5 items-center min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${statusMeta.className}`}>
                      <MethodIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="font-black text-base md:text-lg tracking-tighter">{methodMeta.label}</span>
                        <Badge variant="outline" className={`text-[9px] uppercase gap-1 ${statusMeta.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusMeta.label}
                        </Badge>
                        {escrowMeta && (
                          <Badge variant="outline" className="text-[9px] uppercase gap-1 border-sovereign-gold/20 text-sovereign-gold bg-sovereign-gold/5">
                            <EscrowIcon className="w-3 h-3" />
                            {escrowMeta.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-light flex gap-3 items-center flex-wrap">
                        <span>{paymentDate(payment.created_at)}</span>
                        {payment.booking_id && (
                          <code className="text-[9px] font-mono opacity-40">حجز #{payment.booking_id.slice(0, 8)}</code>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 md:mr-4">
                    <span className="text-lg md:text-xl font-black font-mono text-sovereign-gold">
                      {formatNumber(payment.amount)} دج
                    </span>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

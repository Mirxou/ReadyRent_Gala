'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { returnsApi } from '@/lib/api';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const reasons = [
  'تلف المنتج',
  'منتج خاطئ',
  'عدم مطابقة الوصف',
  'تأخر التسليم',
  'أخرى',
];

export default function ReturnsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);

  // Fetch returns
  const { data: returnsData, isLoading: isLoadingReturns } = useQuery({
    queryKey: ['returns'],
    queryFn: () => returnsApi.listReturns(),
    enabled: isAuthenticated,
  });

  const returns = Array.isArray(returnsData?.data) ? returnsData.data : [];

  // Create return mutation
  const createMutation = useMutation({
    mutationFn: (data: { booking_id: string; reason: string; description?: string }) =>
      returnsApi.createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('تم إرسال طلب الإرجاع بنجاح');
      setShowForm(false);
      setBookingId('');
      setReason('');
      setDescription('');
    },
    onError: () => {
      toast.error('فشل إرسال طلب الإرجاع');
    },
  });

  // Form state
  const [bookingId, setBookingId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/returns');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim()) {
      toast.error('يرجى إدخال رقم الحجز');
      return;
    }
    if (!reason) {
      toast.error('يرجى اختيار سبب الإرجاع');
      return;
    }
    createMutation.mutate({
      booking_id: bookingId.trim(),
      reason,
      description: description || undefined,
    });
  };

  const toggleReturnExpand = (id: string) => {
    setExpandedReturn(expandedReturn === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background text-foreground" dir="rtl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <SovereignGlow color="gold" intensity="high" className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20">
          <div />
        </SovereignGlow>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-sovereign-gold via-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">
                طلبات الإرجاع
              </h1>
              <p className="text-muted-foreground text-base">
                تتبع حالة طلبات إرجاع المنتجات المؤجرة
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <SovereignButton
                variant="primary"
                onClick={() => setShowForm(!showForm)}
              >
                <Plus className="w-4 h-4 ml-2" />
                طلب إرجاع جديد
              </SovereignButton>
            </motion.div>
          </div>
        </motion.div>

        {/* New Return Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="mb-8 overflow-hidden"
            >
              <GlassPanel className="p-6 md:p-8">
                <h2 className="text-xl font-bold mb-6 text-sovereign-gold">طلب إرجاع جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">رقم الحجز</Label>
                      <Input
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        placeholder="أدخل رقم الحجز"
                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">سبب الإرجاع</Label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-10 rounded-md border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50"
                      >
                        <option value="" className="bg-sovereign-obsidian text-white">اختر السبب...</option>
                        {reasons.map((r) => (
                          <option key={r} value={r} className="bg-sovereign-obsidian text-white">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">وصف المشكلة</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اشرح المشكلة بالتفصيل..."
                      className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <SovereignButton
                      variant="primary"
                      type="submit"
                      isLoading={createMutation.isPending}
                    >
                      {createMutation.isPending ? 'جارٍ الإرسال...' : 'إرسال طلب الإرجاع'}
                    </SovereignButton>
                    <SovereignButton
                      variant="ghost"
                      onClick={() => {
                        setShowForm(false);
                        setBookingId('');
                        setReason('');
                        setDescription('');
                      }}
                      disabled={createMutation.isPending}
                    >
                      إلغاء
                    </SovereignButton>
                  </div>
                </form>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Returns List */}
        {isLoadingReturns ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" />
          </div>
        ) : returns.length > 0 ? (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold text-white/60 mb-4">الطلبات المرسلة ({returns.length})</h2>
            {returns.map((ret: Record<string, unknown>, index: number) => (
              <motion.div
                key={ret.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <GlassPanel className="!p-0 overflow-hidden">
                  <button
                    onClick={() => toggleReturnExpand(String(ret.id))}
                    className="w-full p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-right"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border',
                      STATUS_STYLES[ret.status as string] || STATUS_STYLES.pending
                    )}>
                      {ret.status === 'approved' || ret.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : ret.status === 'rejected' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-sm text-white/90">
                          {ret.booking_ref || ret.booking_id || ret.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {ret.created_at ? new Date(ret.created_at as string).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full border',
                          STATUS_STYLES[ret.status as string] || STATUS_STYLES.pending
                        )}>
                          {STATUS_LABELS[ret.status as string] || ret.status}
                        </span>
                      </div>
                    </div>
                    {expandedReturn === String(ret.id) ? (
                      <ChevronUp className="w-5 h-5 text-white/40 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedReturn === String(ret.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-white/40 mb-1">السبب</p>
                              <p className="text-sm font-bold text-white/80">{ret.reason || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40 mb-1">الحالة</p>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <p className="text-sm font-bold">
                                  {STATUS_LABELS[ret.status as string] || ret.status}
                                </p>
                              </div>
                            </div>
                          </div>
                          {ret.description && (
                            <div>
                              <p className="text-xs text-white/40 mb-1">الوصف</p>
                              <p className="text-sm text-white/70 leading-relaxed">{ret.description as string}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <GlassPanel className="p-10 md:p-14 text-center relative overflow-hidden">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sovereign-gold/20 to-sovereign-gold/10 border border-white/10 flex items-center justify-center"
              >
                <Package className="w-12 h-12 text-sovereign-gold/80" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                لا توجد طلبات إرجاع حالياً
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
                لم تقم بطلب إرجاع أي منتجات بعد. يمكنك تقديم طلب إرجاع جديد بالضغط على الزر أعلاه.
              </p>
            </GlassPanel>
          </motion.div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, ChevronDown, ChevronUp, Clock, Eye } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ReturnRequest {
  id: string;
  bookingRef: string;
  reason: string;
  description: string;
  date: string;
  status: string;
  fileName?: string;
}

const reasons = [
  'تلف المنتج',
  'منتج خاطئ',
  'عدم مطابقة الوصف',
  'تأخر التسليم',
  'أخرى',
];

export default function ReturnsPage() {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);

  // Form state
  const [bookingRef, setBookingRef] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingRef.trim()) {
      toast.error('يرجى إدخال رقم الحجز');
      return;
    }
    if (!reason) {
      toast.error('يرجى اختيار سبب الإرجاع');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newReturn: ReturnRequest = {
        id: `RET-${String(returns.length + 1).padStart(4, '0')}`,
        bookingRef: bookingRef,
        reason: reason,
        description: description,
        date: new Date().toLocaleDateString('ar-DZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        status: 'قيد المراجعة',
        fileName: fileName || undefined,
      };

      setReturns([newReturn, ...returns]);
      setIsSubmitting(false);
      setShowForm(false);
      setBookingRef('');
      setReason('');
      setDescription('');
      setFileName(null);

      toast.success('تم إرسال طلب الإرجاع بنجاح');
    }, 1500);
  };

  const toggleReturnExpand = (id: string) => {
    setExpandedReturn(expandedReturn === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white" dir="rtl">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <SovereignGlow color="purple" intensity="high" className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20">
          <div />
        </SovereignGlow>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-3xl">
        {/* Page heading */}
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
                      <Label className="text-white/70 text-sm">رقم الحجز / الطلب</Label>
                      <Input
                        value={bookingRef}
                        onChange={(e) => setBookingRef(e.target.value)}
                        placeholder="مثال: BK-2024-001"
                        className="bg-white/5 border-white/10 text-white"
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

                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">صورة توضيحية (اختياري)</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="return-file-upload"
                      />
                      <label
                        htmlFor="return-file-upload"
                        className="flex items-center gap-4 p-6 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-sovereign-gold/40 hover:bg-sovereign-gold/5 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-sovereign-gold/70" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white/80">
                            {fileName || 'انقر لاختيار صورة'}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">JPG, PNG — الحد الأقصى: 10 ميغابايت</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <SovereignButton
                      variant="primary"
                      type="submit"
                      isLoading={isSubmitting}
                    >
                      {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال طلب الإرجاع'}
                    </SovereignButton>
                    <SovereignButton
                      variant="ghost"
                      onClick={() => {
                        setShowForm(false);
                        setBookingRef('');
                        setReason('');
                        setDescription('');
                        setFileName(null);
                
                      }}
                      disabled={isSubmitting}
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
        {returns.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold text-white/60 mb-4">الطلبات المرسلة ({returns.length})</h2>
            {returns.map((ret, index) => (
              <motion.div
                key={ret.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <GlassPanel className="!p-0 overflow-hidden">
                  {/* Return Header */}
                  <button
                    onClick={() => toggleReturnExpand(ret.id)}
                    className="w-full p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-right"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-sm text-white/90">{ret.id}</span>
                        <span className="text-xs text-white/40">—</span>
                        <span className="text-xs text-white/60">حجز: {ret.bookingRef}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{ret.date}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {ret.status}
                        </span>
                      </div>
                    </div>
                    {expandedReturn === ret.id ? (
                      <ChevronUp className="w-5 h-5 text-white/40 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0" />
                    )}
                  </button>

                  {/* Return Details */}
                  <AnimatePresence>
                    {expandedReturn === ret.id && (
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
                              <p className="text-sm font-bold text-white/80">{ret.reason}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40 mb-1">الحالة</p>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <p className="text-sm font-bold text-amber-400">{ret.status}</p>
                              </div>
                            </div>
                          </div>
                          {ret.description && (
                            <div>
                              <p className="text-xs text-white/40 mb-1">الوصف</p>
                              <p className="text-sm text-white/70 leading-relaxed">{ret.description}</p>
                            </div>
                          )}
                          {ret.fileName && (
                            <div>
                              <p className="text-xs text-white/40 mb-1">الملف المرفق</p>
                              <p className="text-sm text-sovereign-gold">📎 {ret.fileName}</p>
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
        )}

        {/* Empty state - shown only when no returns and form is hidden */}
        {returns.length === 0 && !showForm && (
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
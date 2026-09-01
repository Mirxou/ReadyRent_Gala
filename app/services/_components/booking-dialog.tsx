'use client';

import { useState, useCallback } from 'react';
import { servicesApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { toast } from 'sonner';
import { Sparkles, CalendarCheck, Phone, StickyNote, ArrowLeft } from 'lucide-react';

interface BookingDialogProps {
  service: Record<string, unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ service, open, onOpenChange }: BookingDialogProps) {
  const [formData, setFormData] = useState({
    date: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.date || !formData.phone) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await servicesApi.book({
          serviceId: service.id,
          date: formData.date,
          phone: formData.phone,
          notes: formData.notes,
        });
        if (res.status >= 400 || res.meta?.failed) {
          throw new Error(res.data?.message_ar || 'Booking failed');
        }
        onOpenChange(false);
        setFormData({ date: '', phone: '', notes: '' });
        toast.success(`تم تأكيد حجز "${service.name_ar}" بنجاح! سنتواصل معك قريباً`);
      } catch {
        toast.error('حدث خطأ أثناء تأكيد الحجز. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onOpenChange, service]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sovereign-obsidian border-sovereign-gold/20 text-sovereign-white sm:max-w-lg rounded-2xl p-6 md:p-8 font-arabic" dir="rtl" showCloseButton>
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-black tracking-tight text-sovereign-gold">
            احجز خدمة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            أدخل تفاصيل الحجز لتأكيد طلبك
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-sovereign-gold/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              اسم الخدمة
            </Label>
            <Input
              value={service.name_ar}
              readOnly
              className="bg-white/5 border-sovereign-gold/20 text-sovereign-white cursor-not-allowed opacity-80 h-11"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-sovereign-gold/80 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              تاريخ المناسبة <span className="text-red-400/70">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="bg-white/5 border-sovereign-gold/20 text-sovereign-white focus:border-sovereign-gold/50 h-11 [color-scheme:dark]"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-sovereign-gold/80 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              رقم الهاتف <span className="text-red-400/70">*</span>
            </Label>
            <Input
              type="tel"
              placeholder="0555 123 456"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="bg-white/5 border-sovereign-gold/20 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-sovereign-gold/50 h-11"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-sovereign-gold/80 flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              ملاحظات إضافية
            </Label>
            <Textarea
              placeholder="أضف أي تفاصيل أو طلبات خاصة..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="bg-white/5 border-sovereign-gold/20 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-sovereign-gold/50 min-h-[80px]"
              dir="rtl"
            />
          </div>

          <SovereignButton
            type="submit"
            size="lg"
            variant="primary"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-sovereign-gold/20 text-sm font-black"
            withShimmer
          >
            {isSubmitting ? 'جارٍ التأكيد...' : 'تأكيد الحجز'}
            {!isSubmitting && <ArrowLeft className="w-4 h-4 mr-1" />}
          </SovereignButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

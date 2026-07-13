"use client";

import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';

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
import { toast } from 'sonner';
import {
  Star,
  MapPin,
  ArrowLeft,
  Sparkles,
  PartyPopper,
  Camera,
  Palette,
  Music,
  Flower2,
  CalendarCheck,
  Phone,
  StickyNote,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Animation Variants
   ──────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ════════════════════════════════════════════
   SERVICE CATEGORIES
   ════════════════════════════════════════════ */
const serviceCategories = [
  { icon: PartyPopper, name: 'أعراس', desc: 'قاعات وتنظيم أفراح', slug: 'weddings', categoryMatch: ['أماكن أعراس', 'سيارات أعراس'], gradient: 'from-rose-500/15 to-rose-500/5' },
  { icon: Camera, name: 'تصوير', desc: 'مصورون محترفون', slug: 'photography', categoryMatch: ['مصورين'], gradient: 'from-blue-500/15 to-blue-500/5' },
  { icon: Palette, name: 'مكياج', desc: 'مجمّلات أزياء محترفات', slug: 'makeup', categoryMatch: ['مكياج'], gradient: 'from-pink-500/15 to-pink-500/5' },
  { icon: Music, name: 'دج', desc: 'دي جي لموسيقى لا تُنسى', slug: 'dj', categoryMatch: ['دج'], gradient: 'from-amber-500/15 to-amber-500/5' },
  { icon: Flower2, name: 'زهور', desc: 'تنسيق زهور فاخر', slug: 'flowers', categoryMatch: ['زهور'], gradient: 'from-emerald-500/15 to-emerald-500/5' },
  { icon: Sparkles, name: 'حفلات', desc: 'تنظيم حفلات شاملة', slug: 'parties', categoryMatch: ['تنسيق حفلات', 'طباخين'], gradient: 'from-violet-500/15 to-violet-500/5' },
];

/* ════════════════════════════════════════════
   BOOKING DIALOG
   ════════════════════════════════════════════ */
function BookingDialog({
  service,
  open,
  onOpenChange,
}: {
  service: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
        const res = await fetch('/api/services/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            serviceId: service.id,
            date: formData.date,
            phone: formData.phone,
            notes: formData.notes,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message_ar || 'Booking failed');
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
      <DialogContent className="bg-sovereign-obsidian border-purple-500/20 text-sovereign-white sm:max-w-lg rounded-2xl p-6 md:p-8 font-arabic" dir="rtl" showCloseButton>
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-black tracking-tight text-purple-400">
            احجز خدمة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            أدخل تفاصيل الحجز لتأكيد طلبك
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Service name (pre-filled, read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-purple-400/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              اسم الخدمة
            </Label>
            <Input
              value={service.name_ar}
              readOnly
              className="bg-white/5 border-purple-500/20 text-sovereign-white cursor-not-allowed opacity-80 h-11"
              dir="rtl"
            />
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-purple-400/80 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              تاريخ المناسبة <span className="text-red-400/70">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="bg-white/5 border-purple-500/20 text-sovereign-white focus:border-purple-400/50 h-11 [color-scheme:dark]"
              dir="ltr"
              required
            />
          </div>

          {/* Phone number */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-purple-400/80 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              رقم الهاتف <span className="text-red-400/70">*</span>
            </Label>
            <Input
              type="tel"
              placeholder="0555 123 456"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="bg-white/5 border-purple-500/20 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-purple-400/50 h-11"
              dir="ltr"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-purple-400/80 flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              ملاحظات إضافية
            </Label>
            <Textarea
              placeholder="أضف أي تفاصيل أو طلبات خاصة..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="bg-white/5 border-purple-500/20 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-purple-400/50 min-h-[80px]"
              dir="rtl"
            />
          </div>

          {/* Submit */}
          <SovereignButton
            type="submit"
            size="lg"
            variant="primary"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-2xl shadow-purple-500/20 text-sm font-black"
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

/* ════════════════════════════════════════════
   SECTION 1 — HERO
   ════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-6">
            <SovereignSparkle active={true}>
              <span className="inline-block px-6 py-2 rounded-full border border-purple-400/20 bg-purple-500/5 text-purple-400 text-[10px] font-black tracking-[0.4em] uppercase backdrop-blur-md">
                خدمات المناسبات
              </span>
            </SovereignSparkle>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
            <SovereignGlow color="purple" intensity="high">
              خدمات <span className="text-purple-400">المناسبات</span>
            </SovereignGlow>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            كل ما تحتاجينه لمناسبتك المثالية
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 2 — SERVICE CATEGORIES (filterable)
   ════════════════════════════════════════════ */
function ServiceCategoriesGrid({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 md:mb-14 gap-4"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/60 mb-3">دليل الخدمات</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              أصناف <span className="text-purple-400">الخدمات</span>
            </h2>
          </motion.div>
          {selectedCategory && (
            <motion.div variants={fadeUp}>
              <button
                onClick={() => onSelectCategory(null)}
                className="flex items-center gap-2 text-purple-400 text-sm font-bold hover:gap-3 transition-all"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {serviceCategories.map((cat, i) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
              >
                <button
                  onClick={() => onSelectCategory(isActive ? null : cat.slug)}
                  className="block group h-full w-full text-right"
                >
                  <div
                    className={`relative p-5 md:p-6 rounded-[2rem] border backdrop-blur-sm transition-all duration-500 text-center h-full ${
                      isActive
                        ? 'border-purple-400/40 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-white/5 bg-gradient-to-br ' + cat.gradient + ' hover:border-purple-400/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div
                        className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${
                          isActive
                            ? 'bg-purple-400/20 text-purple-300'
                            : 'bg-purple-400/10 text-purple-400'
                        }`}
                      >
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <h3
                        className={`text-sm md:text-base font-black tracking-tight transition-colors ${
                          isActive ? 'text-purple-300' : 'group-hover:text-purple-400'
                        }`}
                      >
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 hidden sm:block">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 3 — FEATURED SERVICES (with booking)
   ════════════════════════════════════════════ */
function FeaturedServices({
  selectedCategory,
  onBookService,
}: {
  selectedCategory: string | null;
  onBookService: (service: any) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services?limit=50', { credentials: 'include' })
      .then((res) => res.json())
      .then((json: any) => {
        const data = Array.isArray(json.data) ? json.data : [];
        setServices(data);
      })
      .catch(() => setServices([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter services based on selected category
  const filteredServices = selectedCategory
    ? services.filter((s: any) => {
        const cat = serviceCategories.find((c) => c.slug === selectedCategory);
        return cat && cat.categoryMatch.includes(s.category_ar);
      })
    : services.slice(0, 6);

  return (
    <section id="services-section" ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/60 mb-3">
              {selectedCategory ? 'نتائج التصفية' : 'الأفضل تقييماً'}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              {selectedCategory ? (
                <>
                  خدمات{' '}
                  <span className="text-purple-400">
                    {serviceCategories.find((c) => c.slug === selectedCategory)?.name}
                  </span>
                </>
              ) : (
                <>
                  خدمات <span className="text-purple-400">مميزة</span>
                </>
              )}
            </h2>
          </motion.div>
          {!selectedCategory && (
            <motion.div variants={fadeUp}>
              <Link
                href="/local-guide"
                className="flex items-center gap-2 text-purple-400 text-sm font-bold hover:gap-3 transition-all"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {isLoading ? (
          <DignifiedLoader label="جارٍ تحميل الخدمات..." subLabel="يرجى الانتظار قليلاً" />
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground text-lg">
              {selectedCategory ? 'لا توجد خدمات في هذا التصنيف حالياً' : 'لا توجد خدمات حالياً'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredServices.map((service: any, i: number) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
              >
                <GlassPanel
                  variant="obsidian"
                  className="overflow-hidden rounded-[2rem] hover:border-purple-400/20 transition-all duration-500 h-full flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name_ar}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sovereign-obsidian via-transparent to-transparent" />
                    {service.is_verified && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-purple-500/90 backdrop-blur-sm text-[10px] font-bold text-white">
                        موثّق
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 p-6 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black tracking-tight hover:text-purple-400 transition-colors leading-tight">
                        {service.name_ar}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                        <span className="text-sm font-bold">{Number(service.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                      {service.description_ar}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{service.location}</span>
                      </div>
                      <span className="text-xs font-bold text-purple-400/70">
                        {service.category_ar}
                      </span>
                    </div>

                    {/* Booking button */}
                    <div className="pt-3 border-t border-white/5">
                      <SovereignButton
                        onClick={() => onBookService(service)}
                        variant="primary"
                        size="sm"
                        className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-black shadow-lg shadow-purple-500/10"
                      >
                        احجز الآن
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      </SovereignButton>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 4 — CTA
   ════════════════════════════════════════════ */
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-40 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-purple-500/10 rounded-full blur-[160px] opacity-20 animate-pulse pointer-events-none" />

      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
      >
        <motion.div variants={fadeUp}>
          <SovereignSparkle active={true}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/60 mb-6">مناسبتك تنتظرك</p>
          </SovereignSparkle>
        </motion.div>

        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-tight">
          اكتشفي جميع <span className="text-purple-400">الخدمات</span>
        </motion.h2>

        <motion.p variants={fadeUp} className="text-base md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          اعثري على أفضل مزودي الخدمات في الجزائر. من المصورين المحترفين إلى دي جي الحفلات، كل ما تحتاجينه لمناسبتك المثالية.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/local-guide">
            <SovereignButton size="lg" variant="primary" className="h-16 px-12 text-sm rounded-full shadow-2xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700" withShimmer>
              اكتشفي جميع الخدمات
              <ArrowLeft className="w-5 h-5" />
            </SovereignButton>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ════════════════════════════════════════════
   PAGE — SERVICES
   ════════════════════════════════════════════ */
export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookingService, setBookingService] = useState<any>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleSelectCategory = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
    // Scroll to services section
    if (slug !== null) {
      setTimeout(() => {
        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const handleBookService = useCallback((service: any) => {
    setBookingService(service);
    setBookingOpen(true);
  }, []);

  const handleBookingOpenChange = useCallback((open: boolean) => {
    setBookingOpen(open);
    if (!open) {
      setBookingService(null);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <HeroSection />
      <ServiceCategoriesGrid
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      <FeaturedServices
        selectedCategory={selectedCategory}
        onBookService={handleBookService}
      />
      <CTASection />

      {/* Booking Dialog */}
      {bookingService && (
        <BookingDialog
          service={bookingService}
          open={bookingOpen}
          onOpenChange={handleBookingOpenChange}
        />
      )}
    </div>
  );
}
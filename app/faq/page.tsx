'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { useState } from 'react';

const faqs = [
  { id: 1, question: 'كيف يمكنني استئجار فستان؟', answer: 'يمكنك تصفح مجموعتنا واختيار الفستان المناسب، ثم تحديد تواريخ الكراء وإتمام عملية الحجز عبر الدفع الآمن بالبطاقة أو حوالة بريدي موب.' },
  { id: 2, question: 'ما هي شروط الكراء؟', answer: 'يجب تقديم بطاقة هوية وطنية صالحة ودفع مبلغ التأمين. يتم استرداد التأمين كاملاً عند إرجاع الفستان في حالته الأصلية.' },
  { id: 3, question: 'هل يمكنني إلغاء الحجز؟', answer: 'نعم، يمكنك الإلغاء مجاناً قبل 48 ساعة من موعد الاستلام. الإلغاء المتأخر قد يتحمل رسوم جزئية.' },
  { id: 4, question: 'كيف يتم تنظيف الفساتين؟', answer: 'جميع الفساتين تُنظف احترافياً بعد كل كراء باستخدام تقنيات التنظيف الجاف المتطورة مع الاهتمام بكل التفاصيل.' },
  { id: 5, question: 'هل يوجد خدمة توصيل؟', answer: 'نعم، نوفر خدمة توصيل إلى جميع ولايات الجزائر. التوصيل مجاني للطلبات فوق 5 000 دج داخل نفس الولاية.' },
  { id: 6, question: 'كيف أعرف مقاسي؟', answer: 'كل فستان يحتوي على دليل المقاسات الخاص به. يمكنك أيضاً زيارة أحد معارضنا لتجربة الفستان قبل الحجز.' },
  { id: 7, question: 'ماذا لو تضرر الفستان أثناء الكراء؟', answer: 'نوفر تأميناً ضد الأضرار العرضية. تواصل معنا فوراً في حالة أي تلف وسنتكفل بإصلاحه أو استبداله حسب شروط التأمين.' },
  { id: 8, question: 'هل يمكنني كراء أكثر من فستان في نفس الوقت؟', answer: 'بالطبع! يمكنك كراء عدة قطع معاً. كما نوفر حزم خصم عند كراء 3 قطع أو أكثر.' },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFAQs = faqs.filter((faq) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="relative min-h-screen" dir="rtl">
      <ParticleField />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <SovereignSparkle>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sovereign-gold/20 mb-6">
              <HelpCircle className="h-10 w-10 text-sovereign-gold" />
            </div>
          </SovereignSparkle>
          <div className="mb-6" style={{ overflow: 'visible', width: '100%' }}>
            <h1
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                lineHeight: '1.5',
                padding: '2rem 6rem 2rem 1rem',
                margin: '0 auto',
                width: 'auto',
                maxWidth: '100%',
                overflow: 'visible',
                whiteSpace: 'nowrap',
              }}
            >
              الأسئلة الشائعة
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ابحث عن إجابات لأسئلتك الشائعة حول خدماتنا
          </p>
        </motion.div>

        {/* Search */}
        <GlassPanel className="mb-8 !rounded-2xl !p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الأسئلة الشائعة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
        </GlassPanel>

        {filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SovereignGlow color="purple" intensity="low">
                  <GlassPanel
                    variant="obsidian"
                    className="!rounded-2xl !p-0 cursor-pointer overflow-hidden"
                    onClick={() => toggleItem(faq.id)}
                  >
                    <div className="flex items-start justify-between gap-4 p-6">
                      <h3 className="text-lg font-medium leading-relaxed">{faq.question}</h3>
                      <div className="flex-shrink-0 mt-1">
                        {openItems.includes(faq.id) ? (
                          <ChevronUp className="h-5 w-5 text-sovereign-gold" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {openItems.includes(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 pt-0">
                            <div className="border-t border-white/10 pt-4">
                              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassPanel>
                </SovereignGlow>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <p className="text-muted-foreground">لا توجد نتائج مطابقة لبحثك</p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
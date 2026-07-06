'use client';

import { motion } from 'framer-motion';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { ArrowLeft, ScrollText, AlertTriangle, UserCheck, Ban, ShieldAlert } from 'lucide-react';

const sections = [
  {
    icon: <ScrollText className="w-6 h-6 text-sovereign-gold" />,
    title: 'شروط الكراء العامة',
    content: 'يخضع كل عقد كراء لهذه الشروط. مدة الكراء الافتراضية هي 3 أيام تبدأ من تاريخ الاستلام. يجب إرجاع القطعة في حالتها الأصلية مع جميع الإكسسوارات المرافقة. يحق تمديد فترة الكراء بناءً على التوفر مقابل رسوم إضافية تحسب باليوم.',
  },
  {
    icon: <UserCheck className="w-6 h-6 text-sovereign-gold" />,
    title: 'مسؤوليات المستخدم',
    content: 'يلتزم المستخدم بالحفاظ على القطعة المستأجرة في حالة جيدة، وتجنب استخدام أي مواد كيميائية قد تضر بالنسيج. يتحمل المستخدم المسؤولية الكاملة عن أي تلف أو فقدان يحدث للقطعة أثناء فترة الكراء. يجب التحقق من حالة الفستان عند الاستلام وإبلاغنا فوراً عن أي عيب موجود مسبقاً.',
  },
  {
    icon: <Ban className="w-6 h-6 text-sovereign-gold" />,
    title: 'الإلغاء والاسترداد',
    content: 'يمكن الإلغاء مجاناً قبل 48 ساعة من موعد الاستلام. الإلغاء قبل 24 ساعة يتحمل رسوم 30% من قيمة الكراء. لا يُقبل الإلغاء في اليوم المحدد للاستلام. يتم استرداد مبلغ التأمين كاملاً خلال 5-7 أيام عمل بعد إرجاع القطعة وفحصها.',
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-sovereign-gold" />,
    title: 'التأمين والأضرار',
    content: 'يجب دفع مبلغ تأمين يعادل 50% من قيمة الكراء عند الاستلام. في حال حدوث تلف بسيط يمكن إصلاحه، تُخصم تكاليف الإصلاح من مبلغ التأمين. في حال التلف الكلي أو الفقدان، يتحمل المستخدم تعويضاً يعادل القيمة الكاملة للقطعة حسب تقييم المنصة.',
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-sovereign-gold" />,
    title: 'المسؤولية المحدودة',
    content: 'لا تتحمل STANDARD.Rent المسؤولية عن أي أضرار غير مباشرة ناتجة عن استخدام الخدمة. مسؤوليتنا تقتصر على استرداد قيمة الكراء في حالة عدم توفير القطعة المتفق عليها. لا نضمن توفر قطعة معينة في تاريخ محدد رغم التزامنا بتحديث الحالة في الوقت الفعلي.',
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[200px] opacity-30" />
      </div>

      <div className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sovereign-gold/20 mb-6">
                <ScrollText className="h-10 w-10 text-sovereign-gold" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                شروط <span className="text-sovereign-gold">الاستخدام</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                يرجى قراءة هذه الشروط بعناية قبل استخدام منصة STANDARD.Rent
              </p>
              <div className="mt-8">
                <SovereignButton href="/" variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 ml-1" />
                  العودة للرئيسية
                </SovereignButton>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="px-4 pb-20">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Intro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <GlassPanel variant="obsidian" className="!rounded-[2rem]">
                <p className="text-muted-foreground leading-loose text-base md:text-lg">
                  آخر تحديث: يناير 2026. تحكم شروط الاستخدام هذه علاقتك مع STANDARD.Rent. باستخدامك للمنصة أو أي من خدماتها، فإنك توافق على الالتزام بهذه الشروط. نحتفظ بالحق في تعديل هذه الشروط في أي وقت مع إشعار المستخدمين.
                </p>
              </GlassPanel>
            </motion.div>

            {/* Sections */}
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassPanel variant="obsidian" className="!rounded-[2rem]">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 rounded-2xl bg-sovereign-gold/10">
                      {section.icon}
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black mb-3">{section.title}</h2>
                      <p className="text-muted-foreground leading-loose">{section.content}</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground text-sm mb-4">
            هل لديك استفسارات حول شروط الاستخدام؟
          </p>
          <SovereignButton href="/contact" variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 ml-1" />
            اتصل بنا
          </SovereignButton>
        </div>
      </section>
    </div>
  );
}
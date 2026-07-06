'use client';

import { motion } from 'framer-motion';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, Cookie, UserCheck } from 'lucide-react';

const sections = [
  {
    icon: <Database className="w-6 h-6 text-sovereign-gold" />,
    title: 'جمع البيانات',
    content: 'نقوم بجمع البيانات الشخصية التالية عند تسجيلك أو استخدامك للخدمة: الاسم الكامل، عنوان البريد الإلكتروني، رقم الهاتف، عنوان التوصيل، وبطاقة الهوية الوطنية. يتم جمع هذه البيانات حصراً لتقديم خدمات الكراء وإدارة الحجوزات.',
  },
  {
    icon: <Eye className="w-6 h-6 text-sovereign-gold" />,
    title: 'استخدام البيانات',
    content: 'نستخدم بياناتك لتحسين تجربتك على المنصة، إدارة الحجوزات والمدفوعات، التواصل معك بخصوص طلباتك، وتقديم عروض مخصصة بناءً على تفضيلاتك. لا نشارك بياناتك الشخصية مع أطراف ثالثة دون موافقتك الصريحة.',
  },
  {
    icon: <Cookie className="w-6 h-6 text-sovereign-gold" />,
    title: 'ملفات تعريف الارتباط',
    content: 'نستخدم ملفات تعريف الارتباط (Cookies) لتحسين أداء الموقع وتخصيص المحتوى. تشمل هذه الملفات: ملفات الجلسة للحفاظ على تسجيل الدخول، وملفات التحليلات لفهم كيفية استخدام الموقع. يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح.',
  },
  {
    icon: <Lock className="w-6 h-6 text-sovereign-gold" />,
    title: 'أمن البيانات',
    content: 'نتخذ إجراءات أمنية متقدمة لحماية بياناتك الشخصية، بما في ذلك تشفير البيانات أثناء النقل والتخزين، وجدران الحماية، ومراقبة الوصول. لا نحتفظ ببيانات بطاقات الدفع بل نعتمد على بوابات الدفع الآمنة المعتمدة.',
  },
  {
    icon: <UserCheck className="w-6 h-6 text-sovereign-gold" />,
    title: 'حقوق المستخدم',
    content: 'لديك الحق في: الوصول إلى بياناتك الشخصية وتعديلها، طلب حذف حسابك وبياناتك، سحب موافقتك على معالجة البيانات في أي وقت، وتلقي نسخة من بياناتك بصيغة قابلة للقراءة. لممارسة أي من هذه الحقوق، تواصل معنا عبر صفحة اتصل بنا.',
  },
];

export default function PrivacyPage() {
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
                <ShieldCheck className="h-10 w-10 text-sovereign-gold" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                سياسة <span className="text-sovereign-gold">الخصوصية</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية وفقاً للقوانين الجزائرية المعمول بها
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
                  آخر تحديث: يناير 2026. تصف سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها لمنصة STANDARD.Rent. باستخدامك لخدماتنا، فإنك توافق على الممارسات الموضحة في هذه السياسة.
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
            هل لديك أسئلة حول سياسة الخصوصية؟
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
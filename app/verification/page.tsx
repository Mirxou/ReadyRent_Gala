'use client';

import { useState, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Upload,
  User,
  FileText,
  CheckCircle2,
  Circle,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import Link from 'next/link';
import { toast } from 'sonner';

type StepStatus = 'completed' | 'current' | 'pending';

const verificationSteps = [
  {
    step: 1,
    title: 'إدخال البيانات',
    description: 'أدخل بياناتك الشخصية الأساسية: الاسم الكامل، رقم الهاتف، العنوان',
    icon: User,
  },
  {
    step: 2,
    title: 'رفع الوثائق',
    description: 'ارفع صورة واضحة من بطاقة الهوية الوطنية أو جواز السفر',
    icon: Upload,
  },
  {
    step: 3,
    title: 'المراجعة',
    description: 'يقوم فريقنا بمراجعة وثائقك والتحقق من صحتها خلال 24-48 ساعة',
    icon: FileText,
  },
  {
    step: 4,
    title: 'الموافقة',
    description: 'بعد التحقق الناجح، ستحصل على شارة "متحقق" في ملفك الشخصي',
    icon: ShieldCheck,
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] },
  }),
};

export default function VerificationPage() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps progress: 1 completed initially, 2 is current, 3-4 pending
  // After submission: 2 completed, 3 current, 4 pending
  const completedSteps = submitted ? 2 : 1;
  const totalSteps = 4;
  const progressPercent = (completedSteps / totalSteps) * 100;

  const getStepStatus = (stepNum: number): StepStatus => {
    if (stepNum <= completedSteps) return 'completed';
    if (stepNum === completedSteps + 1) return 'current';
    return 'pending';
  };

  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    if (file.size > MAX_SIZE) {
      return 'حجم الملف يتجاوز الحد الأقصى (10 ميغابايت)';
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'نوع الملف غير مدعوم. يُسمح بـ: JPG, PNG, GIF, WebP, PDF';
    }
    return null;
  };

  const handleFileSelect = (file: File | undefined) => {
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        setFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setFileName(file.name);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!fileName) {
      toast.error('يرجى اختيار ملف أولاً');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('تم إرسال الوثائق بنجاح. سيتم مراجعتها خلال 24-48 ساعة.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* Hero */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30 rounded-full py-1 px-4 text-xs font-bold mb-6">
              <Shield className="w-4 h-4" />
              هويتك محمية وموثقة
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-6xl font-black mb-4"
          >
            التحقق من <span className="text-sovereign-gold">الهوية</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            أكمل عملية التحقق لتتمتع بمزايا حصرية وزيادة نقاط ثقتك على المنصة
          </motion.p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <GlassPanel
            className="p-8 rounded-[2rem]"
            variant="obsidian"
            gradientBorder
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-sovereign-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">حالة التحقق</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    تم إكمال {completedSteps} من {totalSteps} خطوات
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-sm py-1 px-4">
                {submitted ? 'قيد المراجعة' : 'قيد التقدم'}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  key={progressPercent}
                  className="h-full rounded-full bg-gradient-to-l from-sovereign-gold to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-16"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-2xl md:text-3xl font-black text-center mb-10"
          >
            خطوات <span className="text-sovereign-gold">التحقق</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.step);
              const isActive = status === 'current';
              const isCompleted = status === 'completed';

              return (
                <motion.div
                  key={step.step}
                  variants={fadeUp}
                  custom={index + 1}
                >
                  <GlassPanel
                    className={`p-6 rounded-[2rem] h-full transition-all ${
                      isActive
                        ? 'border-sovereign-gold/40 shadow-[0_0_30px_rgba(234,179,8,0.05)]'
                        : ''
                    }`}
                    variant="obsidian"
                    gradientBorder={isActive}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : isActive
                            ? 'bg-sovereign-gold/10 border border-sovereign-gold/30'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : isActive ? (
                          <Icon className="w-6 h-6 text-sovereign-gold" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isCompleted
                                ? 'text-emerald-500'
                                : isActive
                                ? 'text-sovereign-gold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            الخطوة {step.step}
                          </span>
                          {isCompleted && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] py-0 px-2">
                              مكتملة
                            </Badge>
                          )}
                          {isActive && (
                            <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30 text-[10px] py-0 px-2">
                              الحالية
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-16"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-2xl md:text-3xl font-black text-center mb-10"
          >
            رفع <span className="text-sovereign-gold">وثائق الهوية</span>
          </motion.h2>

          <GlassPanel
            className="p-8 md:p-12 rounded-[2.5rem] text-center"
            variant="obsidian"
            gradientBorder
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,.pdf"
              className="hidden"
            />

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
                >
                  <FileCheck className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2 text-emerald-400">تم إرسال الوثائق بنجاح</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  سيتم مراجعة وثائقك والتواصل معك خلال 24-48 ساعة
                </p>
              </motion.div>
            ) : (
              <>
                <div
                  className={`border-2 border-dashed rounded-[2rem] p-12 transition-colors cursor-pointer ${
                    fileName
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : dragOver
                      ? 'border-sovereign-gold bg-sovereign-gold/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {fileName ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
                      >
                        <FileCheck className="w-8 h-8 text-emerald-500" />
                      </motion.div>
                      <h3 className="text-lg font-bold mb-1 text-emerald-400">تم اختيار الملف</h3>
                      <p className="text-sm text-sovereign-gold font-bold mb-2">{fileName}</p>
                      <p className="text-xs text-muted-foreground">انقر لتغيير الملف</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-sovereign-gold mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">اسحب الملف هنا أو انقر للاختيار</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        يدعم: JPG, PNG, PDF — الحد الأقصى: 10 ميغابايت
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-8">
                  <SovereignButton
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الوثائق'}
                  </SovereignButton>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>ملفاتك مشفرة ومحمية</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldX className="w-4 h-4 text-emerald-500" />
                    <span>لا يتم مشاركة بياناتك مع أطراف ثالثة</span>
                  </div>
                </div>
              </>
            )}
          </GlassPanel>
        </motion.div>

        {/* Verification Benefits */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-2xl md:text-3xl font-black text-center mb-10"
          >
            فوائد <span className="text-sovereign-gold">التحقق</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'رفع نقاط الثقة',
                description: 'احصل على 15 نقطة إضافية عند اكتمال التحقق',
                emoji: '📈',
              },
              {
                title: 'وصول للمنتجات الحصرية',
                description: 'بعض المنتجات الفاخرة تتطلب تحقق الهوية',
                emoji: '👑',
              },
              {
                title: 'معاملات أسرع',
                description: 'حجوزاتك تُعالج تلقائياً بدون مراجعة يدوية',
                emoji: '⚡',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={fadeUp}
                custom={index + 1}
              >
                <GlassPanel
                  className="p-6 rounded-[2rem] text-center h-full"
                  variant="obsidian"
                >
                  <div className="text-3xl mb-3">{benefit.emoji}</div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="text-center"
        >
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
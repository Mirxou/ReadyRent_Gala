import {
  TrendingUp, Crown, Zap, Lock, UserCheck, Star,
  Camera, Sparkles, Users,
} from 'lucide-react';

export const benefits = [
  { icon: TrendingUp, title: 'رفع نقاط الثقة', description: 'احصل على 15 نقطة إضافية عند اكتمال التحقق مما يعزز مصداقيتك' },
  { icon: Crown, title: 'وصول للمنتجات الحصرية', description: 'المنتجات الفاخرة والحصرية تتطلب توثيق الهوية للوصول إليها' },
  { icon: Zap, title: 'معاملات أسرع', description: 'حجوزاتك تُعالج تلقائياً بدون مراجعة يدوية إضافية' },
  { icon: Lock, title: 'حماية متقدمة', description: 'حسابك محمي بطبقة أمان إضافية وإشعارات فورية' },
  { icon: UserCheck, title: 'المراجعة المجتمعية', description: 'شارك في مراجعة طلبات التحقق بعد توثيق هويتك' },
  { icon: Star, title: 'شارة التوثيق', description: 'احصل على شارة "متحقق" مميزة في ملفك الشخصي' },
];

export const howItWorksSteps = [
  { step: '١', title: 'التقاط الصورة', description: 'التقط صورة واضحة لوجهك باستخدام الكاميرا أو ارفع صورة من جهازك', icon: Camera },
  { step: '٢', title: 'تحليل الذكاء الاصطناعي', description: 'يتم فحص الصورة تلقائياً للتحقق من الجودة ووضوح الوجه', icon: Sparkles },
  { step: '٣', title: 'المراجعة المجتمعية', description: 'يصوّت 5 مستخدمين موثقين على طلبك لضمان النزاهة والشفافية', icon: Users },
];

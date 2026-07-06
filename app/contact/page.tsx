'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Instagram,
  Facebook,
} from 'lucide-react';

const contactInfo = [
  {
    icon: <Mail className="w-5 h-5 text-sovereign-gold" />,
    label: 'البريد الإلكتروني',
    value: 'contact@standardrent.dz',
    href: 'mailto:contact@standardrent.dz',
  },
  {
    icon: <Phone className="w-5 h-5 text-sovereign-gold" />,
    label: 'الهاتف',
    value: '0555 123 456',
    href: 'tel:0555123456',
  },
  {
    icon: <MapPin className="w-5 h-5 text-sovereign-gold" />,
    label: 'العنوان',
    value: 'شارع عباس مراد، قسنطينة، الجزائر',
    href: null,
  },
];

const socialLinks = [
  { icon: <Instagram className="w-5 h-5" />, label: 'انستغرام', href: '#' },
  { icon: <Facebook className="w-5 h-5" />, label: 'فيسبوك', href: '#' },
  { icon: <MessageCircle className="w-5 h-5" />, label: 'واتساب', href: '#' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.email || !formData.message) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('يرجى إدخال بريد إلكتروني صحيح');
        return;
      }
      setIsSubmitting(true);
      fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) {
            setFormData({ name: '', email: '', message: '' });
            toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً');
          } else {
            toast.error('حدث خطأ أثناء الإرسال. حاول مرة أخرى.');
          }
        })
        .catch(() => {
          toast.error('خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى.');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    },
    [formData]
  );

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
                <Send className="h-10 w-10 text-sovereign-gold" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                اتصل <span className="text-sovereign-gold">بنا</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                نحن هنا لمساعدتك. أرسل لنا رسالتك وسنتواصل معك في أقرب وقت
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

        {/* Contact Content */}
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <GlassPanel variant="obsidian" className="!rounded-[2rem]">
                <h2 className="text-2xl font-black mb-6">أرسل لنا رسالة</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-sovereign-gold/80">الاسم الكامل <span className="text-red-400/70">*</span></Label>
                    <Input
                      placeholder="أدخل اسمك الكامل"
                      value={formData.name}
                      onChange={handleChange('name')}
                      className="bg-white/5 border-white/10 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-sovereign-gold/50 h-12"
                      dir="rtl"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-sovereign-gold/80">البريد الإلكتروني <span className="text-red-400/70">*</span></Label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleChange('email')}
                      className="bg-white/5 border-white/10 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-sovereign-gold/50 h-12"
                      dir="ltr"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-sovereign-gold/80">الرسالة <span className="text-red-400/70">*</span></Label>
                    <Textarea
                      placeholder="اكتب رسالتك هنا..."
                      value={formData.message}
                      onChange={handleChange('message')}
                      className="bg-white/5 border-white/10 text-sovereign-white placeholder:text-muted-foreground/50 focus:border-sovereign-gold/50 min-h-[140px]"
                      dir="rtl"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <SovereignButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    withShimmer
                    className="w-full"
                  >
                    إرسال الرسالة
                    <Send className="w-4 h-4 mr-2" />
                  </SovereignButton>
                </form>
              </GlassPanel>
            </motion.div>

            {/* Sidebar Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Contact Info */}
              <GlassPanel variant="obsidian" className="!rounded-[2rem]">
                <h3 className="text-xl font-black mb-5">معلومات التواصل</h3>
                <div className="space-y-5">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 rounded-2xl bg-sovereign-gold/10">
                        {info.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-sovereign-gold/60 mb-1">{info.label}</p>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="text-sm text-muted-foreground hover:text-sovereign-gold transition-colors"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">{info.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Social Media */}
              <GlassPanel variant="gold" className="!rounded-[2rem]">
                <h3 className="text-xl font-black mb-5">تابعينا</h3>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className="flex items-center justify-center w-12 h-12 rounded-2xl bg-sovereign-gold/10 border border-sovereign-gold/20 text-sovereign-gold hover:bg-sovereign-gold/20 hover:border-sovereign-gold/40 transition-all duration-300"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </GlassPanel>

              {/* Quick Links */}
              <GlassPanel variant="obsidian" className="!rounded-[2rem]">
                <h3 className="text-xl font-black mb-4">روابط سريعة</h3>
                <div className="space-y-3">
                  <Link href="/faq" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sovereign-gold transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    الأسئلة الشائعة
                  </Link>
                  <Link href="/privacy" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sovereign-gold transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    سياسة الخصوصية
                  </Link>
                  <Link href="/terms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sovereign-gold transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    شروط الاستخدام
                  </Link>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
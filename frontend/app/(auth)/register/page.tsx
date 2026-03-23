"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import { GlassPanel } from '@/components/sovereign/glass-panel';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { LockKeyhole, Mail, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.data?.user) {
        // 🛡️ Security: Cookie-Based Auth
        setAuth(response.data.user);
        toast.success('تم إنشاء الهوية السيادية بنجاح');
        router.push('/');
      } else {
        // Handle direct login if register returns tokens directly
        router.push('/auth/login');
      }
    } catch (error: any) {
      toast.error('فشل إنشاء الهوية. تحقق من المدخلات.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-sovereign-blue">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-gradient-to-tl from-sovereign-charcoal via-background to-sovereign-blue opacity-90" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <GlassPanel gradientBorder className="p-10 border-sovereign-gold/20 shadow-2xl shadow-sovereign-black/50">

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground">
              انضم إلى النخبة
            </h1>
            <p className="text-sovereign-gold/80 text-xs font-medium tracking-widest uppercase">
              Identity Creation Protocol
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div className="relative group">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
              <input
                {...register('first_name')}
                type="text"
                placeholder="الاسم الكامل"
                className="w-full h-12 pr-12 pl-4 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right"
                required
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
              <input
                {...register('email')}
                type="email"
                placeholder="البريد الإلكتروني"
                className="w-full h-12 pr-12 pl-4 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right"
                required
              />
            </div>

            {/* Phone */}
            <div className="relative group">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
              <input
                {...register('phone_number')}
                type="tel"
                placeholder="رقم الهاتف (+213)"
                className="w-full h-12 pr-12 pl-4 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right"
                required
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
              <input
                {...register('password')}
                type="password"
                placeholder="رمز المرور الآمن"
                className="w-full h-12 pr-12 pl-4 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right font-sans"
                required
              />
            </div>

            <SovereignButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              isLoading={isLoading}
              withShimmer
            >
              تأكيد الهوية
            </SovereignButton>

          </form>

          <div className="mt-8 text-center text-sm">
            <Link href="/auth/login" className="text-muted-foreground hover:text-sovereign-gold transition-colors">
              لدي هوية بالفعل؟ تسجيل الدخول
            </Link>
          </div>

        </GlassPanel>
      </motion.div>
    </div>
  );
}

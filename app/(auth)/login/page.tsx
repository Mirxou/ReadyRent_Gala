"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { Eye, EyeOff, LockKeyhole, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data.email, data.password);

      if (response.status === 429) {
        // Rate limited
        const retryMs = (response.data as { retry_after_ms?: number })?.retry_after_ms || 60000;
        const retrySec = Math.ceil(retryMs / 1000);
        setRateLimitCountdown(retrySec);
        const interval = setInterval(() => {
          setRateLimitCountdown((prev) => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
        toast.error(`محاولات كثيرة. حاول بعد ${retrySec} ثانية.`);
        return;
      }

      if (!response.data || response.status >= 400) {
        const msg = (response.data as { message_ar?: string; message_en?: string; code?: string })?.message_ar
          || 'بيانات الدخول غير صحيحة';
        toast.error(msg);
        return;
      }

      // Auth stored in HttpOnly cookie by server — NO localStorage token.
      // Client only stores user metadata for UI state.
      setAuth(response.data.user);
      toast.success('تم الدخول بنجاح');
      router.push(callbackUrl);
    } catch (_error) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-sovereign-blue">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-sovereign-blue via-background to-sovereign-charcoal opacity-90" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <GlassPanel gradientBorder className="p-10 border-sovereign-gold/20 shadow-2xl shadow-sovereign-black/50">

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-2 text-foreground">
              STANDARD<span className="text-sovereign-gold">.</span>
            </h1>
            <p className="text-sovereign-gold/80 text-sm font-medium tracking-widest uppercase">
              بوابة الدخول الآمن
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
                <input
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'صيغة البريد الإلكتروني غير صحيحة',
                    },
                  })}
                  type="email"
                  placeholder="البريد الإلكتروني الرسمي"
                  autoComplete="email"
                  dir="ltr"
                  className="w-full h-14 pr-12 pl-4 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right placeholder:text-muted-foreground/50"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs text-right pr-2">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative group">
                <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
                <input
                  {...register('password', {
                    required: 'رمز الدخول مطلوب',
                    minLength: {
                      value: 6,
                      message: 'رمز الدخول يجب أن يكون 6 أحرف على الأقل',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="رمز الدخول"
                  autoComplete="current-password"
                  className="w-full h-14 pr-12 pl-12 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right placeholder:text-muted-foreground/50 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs text-right pr-2">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-left">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-sovereign-gold transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                نسيت كلمة المرور؟
              </Link>
            </div>

            <SovereignButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading || rateLimitCountdown > 0}
              disabled={rateLimitCountdown > 0}
              withShimmer
            >
              {rateLimitCountdown > 0
                ? `انتظر ${rateLimitCountdown} ثانية`
                : 'فتح البوابة'
              }
            </SovereignButton>

          </form>

          <div className="mt-8 text-center text-sm">
            <Link href="/register" className="text-muted-foreground hover:text-sovereign-gold transition-colors">
              طلب عضوية جديدة
            </Link>
          </div>

        </GlassPanel>
      </motion.div>
    </div>
  );
}

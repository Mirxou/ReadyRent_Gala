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
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data.email, data.password);
      // 🛡️ Security: Tokens are HttpOnly cookies now.
      // We only store user details in client state.
      setAuth(response.data.user);
      toast.success('Access Granted (الدخول مسموح)');
      router.push('/');
    } catch (error: any) {
      toast.error('Access Denied (بيانات غير صالحة)');
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
              Sovereign Access Terminal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="البريد الإلكتروني الرسمي"
                  className="w-full h-14 pr-12 pl-4 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative group">
                <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sovereign-gold transition-colors" />
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز الدخول"
                  className="w-full h-14 pr-12 pl-12 bg-background/50 border border-white/10 rounded-xl focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/50 outline-none transition-all text-right placeholder:text-muted-foreground/50 font-sans"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <SovereignButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
              withShimmer
            >
              فتح البوابة
            </SovereignButton>

          </form>

          <div className="mt-8 text-center text-sm">
            <Link href="/auth/register" className="text-muted-foreground hover:text-sovereign-gold transition-colors">
              طلب عضوية جديدة
            </Link>
          </div>

        </GlassPanel>
      </motion.div>
    </div>
  );
}

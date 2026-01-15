'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data.email, data.password);
      const { access, refresh, user } = response.data;

      setAuth(user, access, refresh);
      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/');
    } catch (error: any) {
      let errorMessage = 'حدث خطأ في تسجيل الدخول';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = error.message || 'لا يمكن الاتصال بالخادم. تأكد من أن الـ backend يعمل على http://localhost:8000';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        request: error.request,
        config: error.config,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-4xl font-black text-center bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
          تسجيل الدخول
        </CardTitle>
        <CardDescription className="text-center text-lg font-medium text-muted-foreground/60">
          مرحباً بكِ مجدداً في عالم الأناقة
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold mr-1">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-14 rounded-2xl border-white/10 bg-white/5 focus:bg-white/10 focus:ring-gala-purple/30 transition-all text-lg"
              {...register('email', { required: 'البريد الإلكتروني مطلوب' })}
            />
            {errors.email && (
              <p className="text-xs text-red-400 font-bold mr-1">{errors.email.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold mr-1">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              className="h-14 rounded-2xl border-white/10 bg-white/5 focus:bg-white/10 focus:ring-gala-purple/30 transition-all text-lg"
              {...register('password', { required: 'كلمة المرور مطلوبة' })}
            />
            {errors.password && (
              <p className="text-xs text-red-400 font-bold mr-1">{errors.password.message as string}</p>
            )}
          </div>
          <div className="text-left">
            <Link href="/forgot-password" className="text-sm text-gala-purple hover:text-gala-pink transition-colors">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-gala-purple to-gala-pink hover:opacity-90 shadow-lg glow-purple font-black text-lg transition-all" disabled={isLoading}>
            {isLoading ? 'جاري التحقق...' : 'دخول ملكي'}
          </Button>
        </form>
        <div className="mt-8 text-center text-sm">
          <span className="text-muted-foreground font-medium">ليس لديك حساب؟ </span>
          <Link href="/register" className="text-gala-purple font-bold hover:text-gala-pink transition-colors">
            انضمي إلى غالا الآن
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


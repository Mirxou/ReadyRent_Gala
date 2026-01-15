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
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      toast.success('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ في إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-4xl font-black text-center bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
          إنشاء حساب جديد
        </CardTitle>
        <CardDescription className="text-center text-lg font-medium text-muted-foreground/60">
          ابدئي رحلتكِ في عالم الفخامة اليوم
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-bold mr-1">اسم المستخدم</Label>
            <Input
              id="username"
              className="h-14 rounded-2xl border-white/10 bg-white/5 focus:bg-white/10 focus:ring-gala-purple/30 transition-all text-lg"
              {...register('username', { required: 'اسم المستخدم مطلوب' })}
            />
            {errors.username && (
              <p className="text-xs text-red-400 font-bold mr-1">{errors.username.message as string}</p>
            )}
          </div>
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
              {...register('password', {
                required: 'كلمة المرور مطلوبة',
                minLength: { value: 8, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
              })}
            />
            {errors.password && (
              <p className="text-xs text-red-400 font-bold mr-1">{errors.password.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-bold mr-1">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="h-14 rounded-2xl border-white/10 bg-white/5 focus:bg-white/10 focus:ring-gala-purple/30 transition-all text-lg"
              {...register('confirmPassword', {
                required: 'يجب تأكيد كلمة المرور',
                validate: (value) => value === password || 'كلمة المرور غير متطابقة',
              })}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 font-bold mr-1">{errors.confirmPassword.message as string}</p>
            )}
          </div>
          <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-gala-purple to-gala-pink hover:opacity-90 shadow-lg glow-purple font-black text-lg transition-all" disabled={isLoading}>
            {isLoading ? 'جاري التحضير...' : 'انضمي للنخبة'}
          </Button>
        </form>
        <div className="mt-8 text-center text-sm">
          <span className="text-muted-foreground font-medium">لديك حساب بالفعل؟ </span>
          <Link href="/login" className="text-gala-purple font-bold hover:text-gala-pink transition-colors">
            سجلي دخولكِ هنا
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


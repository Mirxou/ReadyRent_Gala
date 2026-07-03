'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, CheckCircle2 } from 'lucide-react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const uidParam = searchParams.get('uid');
    
    if (!tokenParam || !uidParam) {
      toast.error('رابط إعادة تعيين كلمة المرور غير صحيح');
      router.push('/forgot-password');
      return;
    }
    
    setToken(tokenParam);
    setUid(uidParam);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !passwordConfirm) {
      toast.error('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (password !== passwordConfirm) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (!token || !uid) {
      toast.error('رابط إعادة تعيين كلمة المرور غير صحيح');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.passwordResetConfirm(token, uid, password, passwordConfirm);
      setSuccess(true);
      toast.success('تم إعادة تعيين كلمة المرور بنجاح');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10"
        >
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">تم إعادة تعيين كلمة المرور بنجاح!</h2>
            <p className="text-muted-foreground">سيتم تحويلك إلى صفحة تسجيل الدخول...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <ParticleField />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                إعادة تعيين كلمة المرور
              </CardTitle>
              <CardDescription>
                أدخل كلمة المرور الجديدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    يجب أن تكون كلمة المرور 8 أحرف على الأقل
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">تأكيد كلمة المرور</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !token || !uid}>
                  {isLoading ? 'جاري المعالجة...' : 'إعادة تعيين كلمة المرور'}
                </Button>
                <div className="text-center">
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                    العودة إلى تسجيل الدخول
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

'use client'
import { formatNumber } from '@/lib/utils';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { paymentsApi } from '@/lib/api';

interface BaridiMobFormProps {
  amount: number;
  currency?: string;
  bookingId?: number;
  onPaymentInitiated?: (paymentId: number, requiresOtp: boolean) => void;
  onPaymentCompleted?: () => void;
}

export function BaridiMobForm({
  amount,
  currency = 'DZD',
  bookingId,
  onPaymentInitiated,
  onPaymentCompleted,
}: BaridiMobFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentsApi.create({
        payment_method: 'baridimob',
        amount,
        currency,
        booking_id: bookingId,
        phone_number: phoneNumber,
      });

      if (response.success) {
        const paymentData = response.data as Record<string, unknown> | null;
        const pid = (paymentData?.id as string | number) ?? 0;
        setPaymentId(pid as number);
        setStep('otp');
        toast.success('تم إرسال رمز التحقق إلى هاتفك');
        onPaymentInitiated?.(pid as number, true);
      } else {
        toast.error(response.message_ar || 'فشل بدء عملية الدفع');
      }
    } catch (error: unknown) {
      const msg = (error as { message_ar?: string; message?: string })?.message_ar || (error as Error)?.message || 'حدث خطأ أثناء بدء عملية الدفع';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    if (!paymentId) {
      toast.error('خطأ في عملية الدفع');
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentsApi.verifyOtp({ paymentId: String(paymentId), otp: otpCode });

      if (response.success) {
        toast.success('تم الدفع بنجاح!');
        onPaymentCompleted?.();
      } else {
        toast.error(response.message_ar || 'فشل التحقق من رمز OTP');
      }
    } catch (error: unknown) {
      const msg = (error as { message_ar?: string; message?: string })?.message_ar || (error as Error)?.message || 'حدث خطأ أثناء التحقق من رمز OTP';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          الدفع عبر بريدي موب
        </CardTitle>
        <CardDescription>
          المبلغ: {formatNumber(amount)} {currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="213XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground">
                أدخل رقم هاتفك المحمول المسجل في بريدي موب
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'جاري المعالجة...' : 'إرسال رمز التحقق'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">رمز التحقق (OTP)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                dir="ltr"
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                أدخل رمز التحقق المكون من 6 أرقام المرسل إلى {phoneNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('phone')}
                className="flex-1"
              >
                العودة
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'جاري التحقق...' : 'تأكيد الدفع'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Lock } from 'lucide-react';
import { toast } from 'sonner';

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
      const { paymentsApi } = await import('@/lib/api');
      const response = await paymentsApi.create({
        payment_method: 'baridimob',
        amount,
        currency,
        booking_id: bookingId,
        phone_number: phoneNumber,
      });

      if (response.data.success) {
        setPaymentId(response.data.payment.id);
        setStep('otp');
        toast.success('تم إرسال رمز التحقق إلى هاتفك');
        onPaymentInitiated?.(response.data.payment.id, true);
      } else {
        toast.error(response.data.error || 'فشل بدء عملية الدفع');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء بدء عملية الدفع');
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
      const { paymentsApi } = await import('@/lib/api');
      const response = await paymentsApi.verifyOtp(paymentId, otpCode);

      if (response.data.success) {
        toast.success('تم الدفع بنجاح!');
        onPaymentCompleted?.();
      } else {
        toast.error(response.data.error || 'فشل التحقق من رمز OTP');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء التحقق من رمز OTP');
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
          المبلغ: {amount.toLocaleString()} {currency}
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

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface BankCardFormProps {
  amount: number;
  currency?: string;
  bookingId?: number;
  onPaymentInitiated?: (paymentId: number, requires3DSecure?: boolean, redirectUrl?: string) => void;
  onPaymentCompleted?: () => void;
}

export function BankCardForm({
  amount,
  currency = 'DZD',
  bookingId,
  onPaymentInitiated,
  onPaymentCompleted,
}: BankCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('يرجى إدخال رقم بطاقة صحيح');
      return;
    }

    if (!cardExpiry || cardExpiry.length !== 5) {
      toast.error('يرجى إدخال تاريخ انتهاء صحيح (MM/YY)');
      return;
    }

    if (!cardCvv || cardCvv.length < 3) {
      toast.error('يرجى إدخال رمز CVV صحيح');
      return;
    }

    if (!cardholderName || cardholderName.length < 3) {
      toast.error('يرجى إدخال اسم حامل البطاقة');
      return;
    }

    setIsLoading(true);
    try {
      const { paymentsApi } = await import('@/lib/api');
      const response = await paymentsApi.create({
        payment_method: 'bank_card',
        amount,
        currency,
        booking_id: bookingId,
        card_number: cardNumber.replace(/\s/g, ''),
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
        cardholder_name: cardholderName,
      });

      if (response.data.success) {
        if (response.data.requires_3d_secure && response.data.redirect_url) {
          // Redirect to 3D Secure page
          toast.info('جاري التحويل إلى صفحة التحقق الآمن...');
          onPaymentInitiated?.(response.data.payment.id, true, response.data.redirect_url);
          // Redirect to 3D Secure page
          window.location.href = response.data.redirect_url;
        } else {
          toast.success('تم الدفع بنجاح!');
          onPaymentInitiated?.(response.data.payment.id, false);
          onPaymentCompleted?.();
        }
      } else {
        toast.error(response.data.error || 'فشل معالجة الدفع');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء معالجة الدفع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          الدفع بالبطاقة البنكية
        </CardTitle>
        <CardDescription>
          المبلغ: {amount.toLocaleString()} {currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">رقم البطاقة</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              required
              maxLength={19}
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardExpiry">تاريخ الانتهاء</Label>
              <Input
                id="cardExpiry"
                type="text"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                required
                maxLength={5}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardCvv">CVV</Label>
              <Input
                id="cardCvv"
                type="text"
                placeholder="123"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">اسم حامل البطاقة</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="اسم حامل البطاقة كما هو مكتوب على البطاقة"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>جميع المعاملات محمية ومشفرة</span>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'جاري المعالجة...' : 'تأكيد الدفع'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

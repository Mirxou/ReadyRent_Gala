'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { AlertCircle, Clock, DollarSign } from 'lucide-react';

interface CancellationPolicyProps {
  feeInfo: {
    fee_percentage: number;
    fee_amount: number;
    refund_amount: number;
    hours_until_start: number;
  };
  canCancel: boolean;
  message: string;
}

export function CancellationPolicy({ feeInfo, canCancel, message }: CancellationPolicyProps) {
  const getTimeUntilStart = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} يوم`;
    }
    return `${Math.floor(hours)} ساعة`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          سياسة الإلغاء
        </CardTitle>
        <CardDescription>معلومات حول رسوم الإلغاء والاسترجاع</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canCancel && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}

        {canCancel && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>الوقت المتبقي حتى تاريخ البدء: {getTimeUntilStart(feeInfo.hours_until_start)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">رسوم الإلغاء</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {feeInfo.fee_percentage.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {feeInfo.fee_amount.toFixed(2)} دج
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">المبلغ المسترجع</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {feeInfo.refund_amount.toFixed(2)} دج
                </p>
                <p className="text-sm text-muted-foreground">
                  سيتم استرجاعه خلال 48 ساعة
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <p className="text-sm font-medium mb-2">جدول الرسوم (القانون 18-05):</p>
              <ul className="text-sm space-y-1">
                <li>• أكثر من 48 ساعة قبل البدء: 0% رسوم (استرداد كامل)</li>
                <li>• 24-48 ساعة قبل البدء: 50% رسوم (استرداد نصف)</li>
                <li>• أقل من 24 ساعة قبل البدء: 100% رسوم (لا استرداد)</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}



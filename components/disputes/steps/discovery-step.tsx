'use client';

import * as React from 'react';
import { useDisputeStore } from '@/lib/hooks/use-dispute-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, Package, Receipt, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DiscoveryStep() {
  const { formData, setFormData } = useDisputeStore();

  const handleTypeChange = (value: string) => {
    setFormData({ disputeType: value });
  };

  const options = [
    { value: 'damage', label: 'ضرر في المنتج', icon: Package, description: 'كافة الأضرار المادية أو الأعطال التقنية' },
    { value: 'refund', label: 'استرداد مالي', icon: Receipt, description: 'طلب استرداد بسبب عدم الرضا أو إلغاء قانوني' },
    { value: 'delivery', label: 'مشكلة في التوصيل', icon: Truck, description: 'تأخير، تلف أثناء النقل، أو عدم وصول المنتج' },
    { value: 'other', label: 'أسباب أخرى', icon: AlertCircle, description: 'خلافات تعاقدية أو مشاكل تواصل' },
  ];

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-blue-900">ما هو جوهر الخلاف؟</h3>
        <p className="text-gray-500 font-medium">حدد الفئة التي يندرج تحتها نزاعك لبدء المسار القضائي الصحيح.</p>
      </div>

      <RadioGroup
        value={formData.disputeType}
        onValueChange={handleTypeChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {options.map((opt) => (
          <div key={opt.value}>
            <RadioGroupItem
              value={opt.value}
              id={opt.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={opt.value}
              className={cn(
                "flex flex-col items-start gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer hover:bg-gray-50 select-none h-full",
                formData.disputeType === opt.value 
                  ? "border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100" 
                  : "border-gray-100 bg-white"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl",
                formData.disputeType === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
              )}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-lg font-black text-blue-900 block">{opt.label}</span>
                <span className="text-xs text-gray-500 font-medium leading-relaxed block">{opt.description}</span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

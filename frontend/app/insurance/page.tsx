'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InsuranceSelector } from '@/components/insurance-selector';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Shield, Calculator } from 'lucide-react';

export default function InsurancePage() {
  const { toast } = useToast();
  const [productId, setProductId] = useState('');
  const [productValue, setProductValue] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);

  const handleCalculate = async () => {
    if (!productId || !productValue) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال معرف المنتج وقيمة المنتج',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.get(`/warranties/insurance/recommended/?product_id=${productId}`);
      if (response.data.recommended_plan) {
        setSelectedPlan(response.data.recommended_plan);
        toast({
          title: 'تم العثور على خطة',
          description: 'تم العثور على خطة تأمين موصى بها',
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل الحصول على خطة التأمين',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">حاسبة التأمين</h1>
        <p className="text-muted-foreground">احسب سعر التأمين والتغطية للمنتج</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            إدخال البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_id">معرف المنتج</Label>
              <Input
                id="product_id"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="أدخل معرف المنتج"
              />
            </div>
            <div>
              <Label htmlFor="product_value">قيمة المنتج (دج)</Label>
              <Input
                id="product_value"
                type="number"
                value={productValue}
                onChange={(e) => setProductValue(parseFloat(e.target.value) || 0)}
                placeholder="أدخل قيمة المنتج"
              />
            </div>
          </div>
          <Button onClick={handleCalculate}>احسب</Button>
        </CardContent>
      </Card>

      {productId && productValue > 0 && (
        <InsuranceSelector
          productId={parseInt(productId)}
          productValue={productValue}
          onSelect={(plan) => setSelectedPlan(plan)}
        />
      )}
    </div>
  );
}



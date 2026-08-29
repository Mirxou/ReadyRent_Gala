'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, CheckCircle2 } from 'lucide-react';

interface InsurancePlan {
  id: number;
  name: string;
  name_ar: string;
  plan_type: 'basic' | 'premium' | 'full_coverage';
  description: string;
  description_ar: string;
  base_price: number;
  price_percentage: number | null;
  max_coverage_percentage: number;
  deductible_percentage: number;
  covers_damage: boolean;
  covers_theft: boolean;
  covers_loss: boolean;
  covers_accidental_damage: boolean;
  covers_normal_wear: boolean;
  calculated_price?: number;
  calculated_coverage?: number;
}

interface InsuranceCalculation {
  insurance_price: number;
  max_coverage: number;
  deductible: number;
  net_coverage: number;
}

interface InsuranceSelectorProps {
  productId: number;
  productValue: number;
  onSelect?: (plan: InsurancePlan) => void;
  selectedPlanId?: number;
}

export function InsuranceSelector({ productId, productValue, onSelect, selectedPlanId }: InsuranceSelectorProps) {
  const [selectedPlanIdInternal, setSelectedPlanIdInternal] = useState<number | null>(null);

  const activeSelectedPlanId = selectedPlanId ?? selectedPlanIdInternal;

  const { data: plansData, isLoading: loading } = useQuery({
    queryKey: ['insurance-plans', productId],
    queryFn: async () => {
      const response = await api.get(`/warranties/insurance/plans/?product_id=${productId}`);
      const data = response.data?.results ?? response.data ?? [];
      return data as InsurancePlan[];
    },
  });

  const plans = useMemo(() => plansData ?? [], [plansData]);

  const selectedPlan = useMemo(() => {
    if (!activeSelectedPlanId || plans.length === 0) return null;
    return plans.find(p => p.id === activeSelectedPlanId) || null;
  }, [activeSelectedPlanId, plans]);

  const { data: calcData } = useQuery({
    queryKey: ['insurance-calculation', selectedPlan?.id, productValue],
    queryFn: async () => {
      if (!selectedPlan) return null;
      const response = await api.get(`/warranties/insurance/calculator/?plan_id=${selectedPlan.id}&product_value=${productValue}`);
      return response.data as InsuranceCalculation;
    },
    enabled: !!selectedPlan,
  });

  const activeCalculation = calcData;

  const handlePlanSelect = (plan: InsurancePlan) => {
    setSelectedPlanIdInternal(plan.id);
    if (onSelect) {
      onSelect(plan);
    }
  };

  const getPlanTypeBadge = (type: InsurancePlan['plan_type']) => {
    const badges = {
      basic: <Badge className="bg-blue-500">أساسي</Badge>,
      premium: <Badge className="bg-purple-500">مميز</Badge>,
      full_coverage: <Badge className="bg-gold-500">تغطية كاملة</Badge>,
    };
    return badges[type];
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          خيارات التأمين
        </CardTitle>
        <CardDescription>اختر خطة التأمين المناسبة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPlan?.id === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePlanSelect(plan)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{plan.name_ar}</h3>
                    {getPlanTypeBadge(plan.plan_type)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{plan.description_ar}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">التغطية:</span>
                      <span className="font-medium ml-1">{plan.max_coverage_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الخصم:</span>
                      <span className="font-medium ml-1">{plan.deductible_percentage}%</span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-sm">
                    {plan.covers_damage && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تغطية الأضرار</span>
                      </div>
                    )}
                    {plan.covers_accidental_damage && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تغطية الأضرار العرضية</span>
                      </div>
                    )}
                    {plan.covers_theft && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تغطية السرقة</span>
                      </div>
                    )}
                    {plan.covers_loss && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تغطية الفقدان</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {plan.calculated_price !== undefined && (
                    <>
                      <p className="text-lg font-bold">{plan.calculated_price.toFixed(2)} دج</p>
                      <p className="text-xs text-muted-foreground">سعر التأمين</p>
                    </>
                  )}
                  {selectedPlan?.id === plan.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary mt-2" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeCalculation && selectedPlan && (
          <div className="bg-primary/5 border border-primary rounded-lg p-4">
            <p className="font-medium mb-2">تفاصيل التأمين المحدد</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">سعر التأمين</p>
                <p className="font-bold text-lg">{activeCalculation.insurance_price.toFixed(2)} دج</p>
              </div>
              <div>
                <p className="text-muted-foreground">الحد الأقصى للتغطية</p>
                <p className="font-bold text-lg">{activeCalculation.max_coverage.toFixed(2)} دج</p>
              </div>
              <div>
                <p className="text-muted-foreground">الخصم</p>
                <p className="font-medium">{activeCalculation.deductible.toFixed(2)} دج</p>
              </div>
              <div>
                <p className="text-muted-foreground">التغطية الصافية</p>
                <p className="font-medium">{activeCalculation.net_coverage.toFixed(2)} دج</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

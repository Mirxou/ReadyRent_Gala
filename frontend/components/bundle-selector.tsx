'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bundlesApi } from '@/lib/api';
import { ShoppingCart, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface BundleSelectorProps {
  productId?: number;
  startDate: Date | null;
  endDate: Date | null;
  onSelectBundle?: (bundleId: number) => void;
}

export function BundleSelector({
  productId,
  startDate,
  endDate,
  onSelectBundle,
}: BundleSelectorProps) {
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  const [selectedDates, setSelectedDates] = useState({ start: startDate, end: endDate });

  // Fetch bundles - if productId provided, filter bundles containing this product
  const { data: bundles, isLoading } = useQuery({
    queryKey: ['bundles', productId],
    queryFn: () => bundlesApi.getAll().then((res) => res.data),
    select: (data) => {
      const bundlesList = Array.isArray(data) ? data : (data?.results || []);
      // Filter bundles that contain the product if productId provided
      if (productId) {
        return bundlesList.filter((bundle: any) =>
          bundle.items?.some((item: any) => item.product === productId)
        );
      }
      return bundlesList;
    },
  });

  // Calculate price for selected bundle and dates
  const { data: priceCalculation } = useQuery({
    queryKey: ['bundle-price', selectedBundle, selectedDates.start, selectedDates.end],
    queryFn: () => {
      if (!selectedBundle || !selectedDates.start || !selectedDates.end) return null;
      return bundlesApi.calculatePrice(selectedBundle, {
        start_date: format(selectedDates.start, 'yyyy-MM-dd'),
        end_date: format(selectedDates.end, 'yyyy-MM-dd'),
      }).then((res) => res.data);
    },
    enabled: !!selectedBundle && !!selectedDates.start && !!selectedDates.end,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">جاري تحميل الباقات...</p>
        </CardContent>
      </Card>
    );
  }

  const bundlesList = bundles || [];

  if (bundlesList.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          باقات مميزة تحتوي على هذا المنتج
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bundlesList.map((bundle: any) => {
          const isSelected = selectedBundle === bundle.id;
          const calculation = isSelected ? priceCalculation : null;

          return (
            <Card
              key={bundle.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'border-primary shadow-md' : 'hover:border-primary/50'
              }`}
              onClick={() => {
                setSelectedBundle(bundle.id);
                setSelectedDates({ start: startDate, end: endDate });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg">{bundle.name_ar || bundle.name}</h4>
                      {bundle.is_featured && (
                        <Badge variant="default">مميز</Badge>
                      )}
                    </div>
                    {bundle.description_ar && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {bundle.description_ar}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bundle Items */}
                {bundle.items && bundle.items.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">محتويات الباقة:</p>
                    <div className="space-y-1">
                      {bundle.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {item.item_name} {item.quantity > 1 && `(×${item.quantity})`}
                        </div>
                      ))}
                      {bundle.items.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          + {bundle.items.length - 3} منتجات أخرى
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="mt-4 pt-4 border-t">
                  {isSelected && calculation ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">السعر الأساسي:</span>
                        <span className="text-sm line-through text-muted-foreground">
                          {calculation.base_price.toFixed(0)} دج
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">سعر الباقة:</span>
                        <span className="text-lg font-bold text-primary">
                          {calculation.bundle_price.toFixed(0)} دج
                        </span>
                      </div>
                      {calculation.savings > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">التوفير:</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            وفر {calculation.savings.toFixed(0)} دج ({calculation.discount_percentage.toFixed(0)}%)
                          </Badge>
                        </div>
                      )}
                      <Button
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectBundle) {
                            onSelectBundle(bundle.id);
                          }
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 ml-2" />
                        أضف الباقة إلى السلة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">بدءاً من:</span>
                        <span className="text-lg font-bold text-primary">
                          {bundle.bundle_price.toFixed(0)} دج/يوم
                        </span>
                      </div>
                      {bundle.discount_percentage && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          خصم {bundle.discount_percentage.toFixed(0)}%
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBundle(bundle.id);
                        }}
                      >
                        <Calendar className="h-4 w-4 ml-2" />
                        احسب السعر
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}


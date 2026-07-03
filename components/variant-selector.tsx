'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ProductVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  color_hex: string;
  style: string;
  sku: string;
  price: number;
  is_active: boolean;
  availability_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  is_available: boolean;
}

interface VariantSelectorProps {
  productId: number;
  onSelect?: (variant: ProductVariant) => void;
  selectedVariantId?: number;
}

export function VariantSelector({ productId, onSelect, selectedVariantId }: VariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    loadVariants();
  }, [productId]);

  useEffect(() => {
    if (selectedVariantId && variants.length > 0) {
      const variant = variants.find(v => v.id === selectedVariantId);
      if (variant) {
        setSelectedVariant(variant);
        setSelectedSize(variant.size);
        setSelectedColor(variant.color);
      }
    }
  }, [selectedVariantId, variants]);

  const loadVariants = async () => {
    try {
      const response = await api.get(`/products/${productId}/variants/`);
      setVariants(response.data.results || response.data);
    } catch (error: any) {
      console.error('Error loading variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedSize(variant.size);
    setSelectedColor(variant.color);
    if (onSelect) {
      onSelect(variant);
    }
  };

  const getAvailabilityBadge = (status: ProductVariant['availability_status']) => {
    const badges = {
      in_stock: <Badge className="bg-green-500">متوفر</Badge>,
      low_stock: <Badge className="bg-yellow-500">مخزون منخفض</Badge>,
      out_of_stock: <Badge className="bg-red-500">غير متوفر</Badge>,
      unknown: <Badge variant="outline">غير معروف</Badge>,
    };
    return badges[status];
  };

  // Group variants by size and color
  const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
  const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));

  // Filter variants based on selected size and color
  const filteredVariants = variants.filter(v => {
    if (selectedSize && v.size !== selectedSize) return false;
    if (selectedColor && v.color !== selectedColor) return false;
    return true;
  });

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (variants.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">لا توجد متغيرات متاحة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>اختر المتغير</CardTitle>
        <CardDescription>اختر الحجم واللون المطلوب</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sizes.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">الحجم</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">اللون</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const variant = variants.find(v => v.color === color);
                const colorHex = variant?.color_hex;
                return (
                  <Button
                    key={color}
                    variant={selectedColor === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                    style={colorHex ? { backgroundColor: colorHex, color: 'white' } : undefined}
                  >
                    {color}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">المتغيرات المتاحة</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredVariants.map((variant) => (
              <div
                key={variant.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedVariant?.id === variant.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!variant.is_available ? 'opacity-50' : ''}`}
                onClick={() => variant.is_available && handleVariantSelect(variant)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{variant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {variant.size} - {variant.color}
                    </p>
                    <p className="text-sm font-medium mt-1">{variant.price.toFixed(2)} دج/يوم</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getAvailabilityBadge(variant.availability_status)}
                    {selectedVariant?.id === variant.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedVariant && (
          <div className="bg-primary/5 border border-primary rounded-lg p-4">
            <p className="font-medium mb-2">المتغير المحدد</p>
            <div className="flex items-center justify-between">
              <div>
                <p>{selectedVariant.name}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {selectedVariant.sku}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{selectedVariant.price.toFixed(2)} دج/يوم</p>
                {getAvailabilityBadge(selectedVariant.availability_status)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { productsApi } from '@/lib/api';
import { Palette, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface AccessorySuggestionsProps {
  productId: number;
  limit?: number;
}

export function AccessorySuggestions({ productId, limit = 5 }: AccessorySuggestionsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['matching-accessories', productId, limit],
    queryFn: () => productsApi.getMatchingAccessories(productId, limit).then((res) => res.data),
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">جاري تحميل الإكسسوارات المقترحة...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.accessories || data.accessories.length === 0) {
    return null;
  }

  const getCompatibilityBadge = (compatibility: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      perfect: { label: 'مثالي', variant: 'default' },
      good: { label: 'جيد', variant: 'secondary' },
      acceptable: { label: 'مقبول', variant: 'outline' },
    };

    const compatConfig = config[compatibility] || config.acceptable;
    return <Badge variant={compatConfig.variant}>{compatConfig.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          إكسسوارات متوافقة مع هذا المنتج
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {data.accessories.map((accessory: any) => (
            <div key={accessory.id} className="relative">
              <div className="relative group">
                <Link href={`/products/${accessory.slug || accessory.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg">
                        {accessory.primary_image || accessory.images?.[0]?.image ? (
                          <img
                            src={accessory.primary_image || accessory.images[0].image}
                            alt={accessory.name_ar || accessory.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Palette className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Compatibility Badge */}
                        <div className="absolute top-2 left-2">
                          {getCompatibilityBadge(accessory.compatibility || accessory.compatibility_label)}
                        </div>

                        {/* Color Circle */}
                        {accessory.color_hex && (
                          <div className="absolute bottom-2 right-2">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-background shadow-md"
                              style={{ backgroundColor: accessory.color_hex }}
                              title={accessory.color}
                            />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 space-y-2">
                        <h4 className="font-semibold text-sm line-clamp-1">
                          {accessory.name_ar || accessory.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">
                            {Number(accessory.price_per_day).toFixed(0)} دج/يوم
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Product Color Info */}
        {data.primary_product_color && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <span>لون المنتج الأساسي:</span>
            {data.primary_product_color.startsWith('#') ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: data.primary_product_color }}
                />
                <span className="font-semibold text-foreground">{data.primary_product_color}</span>
              </div>
            ) : (
              <span className="font-semibold text-foreground">{data.primary_product_color}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


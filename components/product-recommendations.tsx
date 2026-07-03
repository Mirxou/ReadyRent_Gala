'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/product-card';
import { productsApi } from '@/lib/api';
import { Sparkles } from 'lucide-react';

interface ProductRecommendationsProps {
  productId: number;
  limit?: number;
}

export function ProductRecommendations({ productId, limit = 6 }: ProductRecommendationsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['product-recommendations', productId, limit],
    queryFn: () => productsApi.getRecommendations(productId, limit).then((res) => res.data),
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">جاري تحميل المنتجات المقترحة...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="card-glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-gala-gold" />
          قد يعجبك أيضاً
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.recommendations.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface ProductCardProps {
  product: {
    id: number;
    name_ar: string;
    slug: string;
    price_per_day: number;
    category?: {
      name_ar: string;
    };
    images?: Array<{
      image: string;
      is_primary: boolean;
    }>;
    primary_image?: string;
    rating?: number;
    is_featured?: boolean;
  };
  priority?: boolean;
}

function ProductCardComponent({ product, priority = false }: ProductCardProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Check wishlist status
  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-status', product.id],
    queryFn: () => productsApi.checkWishlist(product.id).then((res) => res.data),
    enabled: isAuthenticated,
  });
  
  const isInWishlist = wishlistStatus?.in_wishlist || false;
  
  // Toggle wishlist mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: () => productsApi.toggleWishlist(product.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-status', product.id] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (data.data?.in_wishlist) {
        toast.success('تم إضافة المنتج إلى قائمة المفضلة');
      } else {
        toast.success('تم إزالة المنتج من قائمة المفضلة');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث قائمة المفضلة');
    },
  });
  
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول لإضافة المنتج إلى المفضلة');
      return;
    }
    toggleWishlistMutation.mutate();
  };
  
  const primaryImage = product.primary_image || 
                       product.images?.find((img) => img.is_primary)?.image || 
                       product.images?.[0]?.image || 
                       'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop';

  return (
    <Card className="group hover:shadow-lg transition-shadow" role="article" aria-labelledby={`product-title-${product.id}`}>
      <Link href={`/products/${product.slug || product.id}`} aria-label={`انتقل إلى صفحة ${product.name_ar}`}>
        <CardHeader className="p-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg">
            <Image
              src={primaryImage}
              alt={product.name_ar}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading={priority ? undefined : "lazy"}
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {product.is_featured && (
              <Badge className="absolute top-2 left-2">مميز</Badge>
            )}
            {product.rating && typeof product.rating === 'number' && (
              <div 
                className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full"
                aria-label={`التقييم: ${Number(product.rating).toFixed(1)} من 5`}
                role="img"
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                <span className="text-xs font-semibold">{Number(product.rating).toFixed(1)}</span>
              </div>
            )}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 bg-background/80 hover:bg-background/90 backdrop-blur-sm h-8 w-8"
                onClick={handleWishlistClick}
                disabled={toggleWishlistMutation.isPending}
                aria-label={isInWishlist ? 'إزالة من قائمة المفضلة' : 'إضافة إلى قائمة المفضلة'}
                aria-pressed={isInWishlist}
                title={isInWishlist ? 'إزالة من قائمة المفضلة' : 'إضافة إلى قائمة المفضلة'}
              >
                <Heart 
                  className={`h-4 w-4 transition-colors ${
                    isInWishlist 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                  aria-hidden="true"
                />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {product.category && (
            <p className="text-sm text-muted-foreground mb-1">{product.category.name_ar}</p>
          )}
          <h3 id={`product-title-${product.id}`} className="font-semibold text-lg mb-2 line-clamp-2">
            {product.name_ar}
          </h3>
          <p className="text-2xl font-bold text-primary" aria-label={`السعر: ${Number(product.price_per_day || 0).toFixed(0)} دينار جزائري في اليوم`}>
            {Number(product.price_per_day || 0).toFixed(0)} دج/يوم
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button 
            className="flex-1" 
            aria-label={`عرض تفاصيل ${product.name_ar}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/products/${product.slug || product.id}`);
            }}
          >
            عرض التفاصيل
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            aria-label={`إضافة ${product.name_ar} إلى السلة`}
            title="إضافة إلى السلة"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}

export const ProductCard = React.memo(ProductCardComponent);
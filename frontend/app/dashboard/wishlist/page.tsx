'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => productsApi.getWishlist().then((res) => res.data),
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (id: number) => productsApi.removeFromWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('تم إزالة المنتج من قائمة المفضلة');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إزالة المنتج');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-t-4 border-gala-purple animate-spin"></div>
      </div>
    );
  }

  const items = wishlist || [];

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 card-glass p-12 rounded-[2.5rem] max-w-lg mx-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-gala-purple to-gala-pink rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Heart className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
            قائمة المفضلة فارغة
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            لم تقومي بإضافة أي منتجات إلى قائمة المفضلة بعد
          </p>
          <Button asChild size="lg" className="px-8">
            <Link href="/products">تصفح المنتجات</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <ParticleField />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-8 text-center"
          style={{
            background: 'linear-gradient(to right, rgb(139, 92, 246), rgb(236, 72, 153), rgb(245, 158, 11))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
            lineHeight: '1.2',
            padding: '0.5rem 0',
          }}
        >
          قائمة المفضلة
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {items.map((item: any, index: number) => {
              const product = item.product;
              const primaryImage = product.primary_image || '/placeholder-product.jpg';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="card-glass border-0 overflow-hidden group h-full flex flex-col">
                    <div className="relative w-full h-64 overflow-hidden">
                      <Image
                        src={primaryImage}
                        alt={product.name_ar}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-white/20 hover:bg-red-500/80 backdrop-blur-md"
                          onClick={() => removeFromWishlistMutation.mutate(item.id)}
                        >
                          <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      {product.category && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-gala-purple/80 backdrop-blur-md">
                            {product.category.name_ar}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6 flex-1 flex flex-col">
                      <h3 className="font-bold text-xl mb-2 group-hover:text-gala-purple transition-colors">
                        {product.name_ar}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-4">
                        <div className="text-2xl font-black bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                          {product.price_per_day.toLocaleString()} دج/يوم
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/products/${product.slug}`}>
                            <ShoppingCart className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

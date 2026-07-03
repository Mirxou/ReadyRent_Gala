'use client';

import { useQuery } from '@tanstack/react-query';
import { bundlesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, Percent, Calendar, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bundleId = params.id as string;
  const { isAuthenticated } = useAuthStore();

  const { data: bundle, isLoading } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => bundlesApi.getById(Number(bundleId)).then((res) => res.data),
    enabled: !!bundleId,
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      router.push('/login?redirect=/bundles/' + bundleId);
      return;
    }

    if (!bundle) {
      toast.error('الحزمة غير موجودة');
      return;
    }

    try {
      // Create bundle booking directly (bundles are booked as a whole)
      await bundlesApi.createBooking({
        bundle_id: bundle.id,
        start_date: new Date().toISOString().split('T')[0], // Default to today
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days
      });
      toast.success('تم إضافة الحزمة للسلة بنجاح');
      router.push('/cart');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء إضافة الحزمة');
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الحزمة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">الحزمة غير موجودة</p>
              <Button asChild className="mt-4">
                <Link href="/bundles">العودة للحزم</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/bundles" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للحزم
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image */}
            <div>
              {bundle.image && (
                <div className="relative w-full h-96 overflow-hidden rounded-2xl mb-4">
                  <img
                    src={bundle.image}
                    alt={bundle.name}
                    className="w-full h-full object-cover"
                  />
                  {bundle.discount_percentage > 0 && (
                    <Badge className="absolute top-4 left-4 bg-gala-pink text-lg px-4 py-2">
                      <Percent className="h-4 w-4 mr-1" />
                      خصم {bundle.discount_percentage}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {bundle.category && (
                <Badge variant="outline" className="mb-4">
                  {bundle.category.name}
                </Badge>
              )}
              
              <h1 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  lineHeight: '1.5',
                  padding: '1rem 2rem',
                  overflow: 'visible',
                }}
              >
                {bundle.name}
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                {bundle.description}
              </p>

              {/* Pricing */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    {bundle.original_price && bundle.discounted_price && (
                      <>
                        <div className="text-3xl font-bold text-gala-purple">
                          {Number(bundle.discounted_price).toFixed(0)} دج
                        </div>
                        <div className="text-xl text-muted-foreground line-through">
                          {Number(bundle.original_price).toFixed(0)} دج
                        </div>
                        {bundle.discount_percentage > 0 && (
                          <Badge className="bg-green-500">
                            وفرت {Number(bundle.original_price - bundle.discounted_price).toFixed(0)} دج
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  
                  {bundle.items_count && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{bundle.items_count} عنصر في هذه الحزمة</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-gala-purple to-gala-pink hover:opacity-90"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  إضافة للسلة
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link href="/products">
                    عرض المنتجات الفردية
                  </Link>
                </Button>
              </div>

              {/* Bundle Items */}
              {bundle.items && bundle.items.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-4">عناصر الحزمة</h3>
                    <div className="space-y-2">
                      {bundle.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span>{item.product_name || item.name}</span>
                          {item.quantity > 1 && (
                            <Badge variant="outline">x{item.quantity}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


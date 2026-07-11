'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, Star, Percent, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';

interface ApiBundle {
  id: number;
  name: string;
  nameAr: string;
  descriptionAr: string;
  discountPercentage: number;
  totalPrice: number;
  image: string;
  includes: string;
  validDays: number;
}

interface DisplayBundle {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  items: number;
  rating: number;
}

function mapApiBundle(b: ApiBundle): DisplayBundle {
  let includesCount = 0;
  try {
    const parsed = JSON.parse(b.includes);
    includesCount = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    includesCount = 0;
  }
  const originalPrice = b.discountPercentage > 0
    ? Math.round(b.totalPrice / (1 - b.discountPercentage / 100))
    : b.totalPrice;
  return {
    id: b.id,
    name: b.nameAr || b.name,
    description: b.descriptionAr,
    price: b.totalPrice,
    originalPrice,
    items: includesCount,
    rating: 4.8,
  };
}

function BundlesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <GlassPanel variant="obsidian" className="!rounded-2xl !p-6 space-y-5">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-2">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          </GlassPanel>
        </div>
      ))}
    </div>
  );
}

export default function BundlesPage() {
  const [search, setSearch] = useState('');
  const [bundles, setBundles] = useState<DisplayBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch('/api/bundles/bundles')
      .then((r) => r.json())
      .then((d) => {
        const list = d?.data || [];
        setBundles(list.map(mapApiBundle));
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setIsLoading(false);
      });
  }, []);

  const filteredBundles = bundles.filter((bundle) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        bundle.name.toLowerCase().includes(searchLower) ||
        bundle.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className="relative min-h-screen" dir="rtl">
      <ParticleField />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center px-6 py-8 md:px-12 md:py-16"
        >
          <SovereignSparkle>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sovereign-gold/20 mb-6">
              <Package className="h-10 w-10 text-sovereign-gold" />
            </div>
          </SovereignSparkle>
          <div className="mb-6">
            <h1
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                lineHeight: '1.1',
                padding: '0.5rem 1rem',
              }}
            >
              الحزم المجمعة
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            احجز مجموعة كاملة بخصم خاص - وفر أكثر واحصل على المزيد
          </p>
        </motion.div>

        {/* Search */}
        <GlassPanel className="mb-8 !rounded-2xl !p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الحزم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
        </GlassPanel>

        {isLoading ? (
          <BundlesLoadingSkeleton />
        ) : isError ? (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-muted-foreground mb-2">تعذر تحميل الحزم. يرجى المحاولة لاحقاً.</p>
            <button onClick={() => window.location.reload()} className="text-sovereign-gold text-sm hover:underline">
              إعادة المحاولة
            </button>
          </GlassPanel>
        ) : filteredBundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBundles.map((bundle, index) => {
              const discount = getDiscount(bundle.originalPrice, bundle.price);
              return (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/bundles/${bundle.id}`} className="block h-full">
                  <SovereignGlow color="purple" intensity="low">
                    <GlassPanel
                      variant="obsidian"
                      className="!rounded-2xl !p-0 overflow-hidden cursor-pointer group h-full"
                    >
                      {/* Discount badge */}
                      <div className="relative p-6 pb-0">
                        {discount > 0 && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-sovereign-gold text-white border-0">
                              <Percent className="h-3 w-3 ml-1" />
                              خصم {discount}%
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Bundle name & rating */}
                        <div className="mb-3">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-sovereign-gold transition-colors leading-relaxed">
                            {bundle.name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-medium">{bundle.rating}</span>
                            <span className="text-xs text-muted-foreground mr-1">({bundle.items} عناصر)</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                          {bundle.description}
                        </p>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-sovereign-gold">
                                {formatNumber(bundle.price)} دج
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatNumber(bundle.originalPrice)} دج
                            </span>
                          </div>
                          <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-sovereign-gold group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </GlassPanel>
                  </SovereignGlow>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد حزم مطابقة لبحثك</p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
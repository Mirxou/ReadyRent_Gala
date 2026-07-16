'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Sparkles } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProductRecommendationsProps {
  productId: string;
}

const PLACEHOLDER = 'https://picsum.photos/seed/standard-placeholder/600/800';

interface RecommendationProduct {
  id: string;
  name_ar: string;
  slug?: string;
  price_per_day: number;
  primary_image?: string | null;
  images?: { image?: string; url?: string; is_main?: boolean; is_primary?: boolean }[];
  is_premium?: boolean;
  category?: { name_ar?: string } | null;
}

/** Compact recommendation card for the horizontal row */
function RecommendationCard({ product }: { product: RecommendationProduct }) {
  const primaryImage =
    product.primary_image ||
    product.images?.[0]?.image ||
    product.images?.[0]?.url ||
    PLACEHOLDER;

  return (
    <Link href={`/products/${product.id}`} className="flex-shrink-0 w-[220px] sm:w-[240px] group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-[1.5rem] overflow-hidden border border-white/5 bg-white/5 backdrop-blur-md transition-all duration-500 group-hover:border-sovereign-gold/20"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={primaryImage}
            alt={product.name_ar || 'صورة المنتج'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {product.is_premium && (
            <div className="absolute top-3 right-3">
              <span className="inline-block bg-sovereign-gold text-black text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-xl">
                متميز
              </span>
            </div>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-3 right-3 left-3">
            <p className="text-lg font-black tracking-tighter text-white">
              {formatNumber(product.price_per_day)}{' '}
              <span className="text-[10px] font-normal opacity-60">دج/يوم</span>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sovereign-gold/60 truncate">
            {product.category?.name_ar || 'الفئة'}
          </p>
          <h4 className="text-sm font-black italic tracking-tighter truncate group-hover:text-sovereign-gold transition-colors">
            {product.name_ar}
          </h4>
        </div>
      </motion.div>
    </Link>
  );
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['product-recommendations', productId],
    queryFn: () => productsApi.getRecommendations(productId).then((res) => res.data),
    enabled: !!productId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Silently hide on error
  if (isError || (!isLoading && (!data || !data.recommendations || data.recommendations.length === 0))) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-sovereign-gold animate-pulse" />
          <Skeleton className="h-8 w-48 rounded-2xl" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[220px] sm:w-[240px] space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-[1.5rem]" />
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const recommendations = (data.recommendations || []).slice(0, 4);

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-3xl font-black italic">توصيات ذكية</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">
            اختيارات مخصصة لك بناءً على ذوقك
          </p>
        </div>
      </div>

      <GlassPanel className="p-6" gradientBorder>
        <div
          className={cn(
            'flex gap-4 overflow-x-auto pb-2',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10'
          )}
          style={{ scrollbarWidth: 'thin' }}
        >
          {recommendations.map((product: RecommendationProduct) => (
            <RecommendationCard key={product.id} product={product} />
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
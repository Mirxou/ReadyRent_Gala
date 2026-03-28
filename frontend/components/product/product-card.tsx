'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, Heart } from 'lucide-react';
import { designTokens } from '@/lib/utils/design-tokens';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBookingStore } from '@/lib/hooks/use-booking-store';

import { Product } from '@/lib/api/products';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { setIsOpen, updateFormData } = useBookingStore();

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateFormData({ productId: product.id.toString() });
    setIsOpen(true);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-xl"
    >
      {/* Image Section */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden">
        <Image
          src={product.primary_image || 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80'}
          alt={product.name_ar}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlays */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="secondary" className="w-full font-bold">
            عرض التفاصيل
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_verified && (
            <Badge className="bg-success text-white border-none flex gap-1 items-center">
              <Shield className="h-3 w-3" />
              موثق
            </Badge>
          )}
          {product.trust_score && product.trust_score > 90 && (
            <Badge className="bg-primary-500 text-white border-none flex gap-1 items-center">
              <Zap className="h-3 w-3" />
              موثوق عالي
            </Badge>
          )}
        </div>
        
        <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-500 hover:text-error transition-colors">
          <Heart className="h-5 w-5" />
        </button>
      </Link>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
            {product.category?.name_ar || 'تصنيف عام'}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-gray-900">{product.rating || '5.0'}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {product.name_ar}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-gray-900">{product.price_per_day}</span>
            <span className="text-sm font-semibold text-gray-500 mr-1">دج/يوم</span>
          </div>
          
          <Button 
            onClick={handleBookNow}
            className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-auto active:scale-95 transition-all"
          >
            احجز الآن
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

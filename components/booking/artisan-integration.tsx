'use client';

import { useQuery } from '@tanstack/react-query';
import { artisansApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Star, Check, Plus, Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ArtisanIntegrationProps {
  productId: number;
  onSelect: (artisanId: number | null) => void;
  selectedId: number | null;
}

export function ArtisanIntegration({ productId, onSelect, selectedId }: ArtisanIntegrationProps) {
  const { data: artisans, isLoading } = useQuery({
    queryKey: ['artisans-selection'],
    queryFn: () => artisansApi.getAll({ specialty: 'tailor' }).then(res => res.data),
  });

  const artisansList = artisans?.results || artisans || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Scissors className="w-4 h-4 text-sovereign-gold" />
          تعديل القياس (Tailoring & Fitting)
        </h4>
        <Badge variant="outline" className="text-[10px] opacity-60">Elite Service</Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        هل ترغبين في تعديل مقاس الفستان ليناسبك تماماً؟ اختاري من نخبة المصممات الموثوقات لدينا.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>جاري البحث عن أنامل ذهبية...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {artisansList.slice(0, 3).map((artisan: any) => (
            <motion.div
              key={artisan.id}
              whileHover={{ x: -4 }}
              onClick={() => onSelect(selectedId === artisan.id ? null : artisan.id)}
              className={cn(
                "group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden",
                selectedId === artisan.id
                  ? "border-sovereign-gold bg-sovereign-gold/5 shadow-lg shadow-sovereign-gold/5"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              )}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                  <Image
                    src={artisan.profile_image || '/placeholder-artisan.jpg'}
                    alt={artisan.name_ar}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm truncate">{artisan.name_ar}</h5>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-sovereign-gold">
                      <Star className="w-3 h-3 fill-sovereign-gold" />
                      {Number(artisan.rating || 5).toFixed(1)}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{artisan.bio_ar || 'خياطة وتصميم احترافي'}</p>
                </div>

                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  selectedId === artisan.id
                    ? "bg-sovereign-gold text-background"
                    : "bg-white/10 text-transparent group-hover:text-white/40"
                )}>
                  {selectedId === artisan.id ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold"
        >
          ✅ سيتم إضافة خدمة التعديل لطلبك. سنتواصل معك لتنسيق القياسات.
        </motion.div>
      )}
    </div>
  );
}

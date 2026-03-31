"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, Heart, MapPin, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import { SovereignGlow, SovereignSparkle } from '@/components/sovereign/sovereign-sparkle';
import { IdentityShield } from '@/components/sovereign/identity-shield';

interface ProductCardProps {
  product: any;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const isElite = product.is_premium || (product.trust_score && product.trust_score > 90);
  const primaryImage = product.primary_image || (product.images && product.images[0]?.image) || product.image || '';

  return (
    <SovereignGlow color={isElite ? 'gold' : 'blue'}>
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="group relative flex flex-col bg-background rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl transition-all duration-500 hover:border-sovereign-gold/20"
        >
            {/* Image AUTHORITY */}
            <Link href={`/products/${product.id || product.slug}`} className="block relative aspect-[3/4] overflow-hidden">
                <Image
                    src={primaryImage}
                    alt={product.name_ar || ''}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    priority={priority}
                />
                
                {/* Elite Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Sovereign Badges */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                    <SovereignSparkle active={isElite}>
                        <Badge className={cn(
                            "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border-none shadow-2xl italic",
                            isElite ? "bg-sovereign-gold text-black" : "bg-black/60 text-white backdrop-blur-md"
                        )}>
                            {isElite ? 'Elite Asset' : 'Verified Standard'}
                        </Badge>
                    </SovereignSparkle>
                </div>

                <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IdentityShield status="verified" showLabel={false} trustScore={product.trust_score || 85} className="w-12 h-12" />
                </div>

                <div className="absolute bottom-6 inset-x-6">
                    <SovereignButton variant="primary" className="w-full h-12 text-xs font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 rounded-xl" withShimmer>
                        عرض الميثاق السيادي
                    </SovereignButton>
                </div>
            </Link>

            {/* Narrative Section */}
            <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sovereign-gold/60">{product.category?.name_ar || 'تصنيف ملكي'}</p>
                        <h3 className="text-xl font-black italic tracking-tighter group-hover:text-sovereign-gold transition-colors line-clamp-1">
                            {product.name_ar}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <Star className="w-3 h-3 fill-sovereign-gold text-sovereign-gold" />
                        <span className="text-xs font-bold font-mono tracking-tighter">{Number(product.rating || 5).toFixed(1)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground opacity-60">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{product.location || 'الجزائر العاصمة'}</span>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-end justify-between mt-auto">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">24H Contract Value</p>
                        <p className="text-2xl font-black tracking-tighter">
                            {Number(product.price_per_day).toLocaleString()} <span className="text-xs font-normal opacity-40">DA</span>
                        </p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <Heart className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    </SovereignGlow>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  Package,
  TrendingUp,
  Shield,
  ExternalLink,
  Calendar,
  ChevronLeft,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/product-card';

interface Vendor {
  id: number;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  logo?: string;
  avatar?: string;
  rating?: number;
  products_count?: number;
  location?: string;
  city?: string;
  is_verified?: boolean;
  total_sales?: number;
  website?: string;
  trust_score?: number;
  joined_date?: string;
}

interface Product {
  id: number;
  name_ar: string;
  primary_image?: string;
  images?: { url: string; is_main: boolean }[];
  image?: string;
  price_per_day: number;
  rating?: number;
  category?: { name_ar: string; slug: string };
  location?: string;
  is_premium?: boolean;
  trust_score?: number;
  slug?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] as const },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = Number(params.id);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [vendorRes, productsRes] = await Promise.all([
          fetch('/api/vendors/vendors'),
          fetch('/api/products'),
        ]);

        if (!vendorRes.ok || !productsRes.ok) {
          setNotFound(true);
          return;
        }

        const vendorData = await vendorRes.json();
        const productsData = await productsRes.json();

        const foundVendor = (vendorData.data || []).find(
          (v: Vendor) => v.id === vendorId
        );

        if (!foundVendor) {
          setNotFound(true);
          return;
        }

        setVendor(foundVendor);

        const vendorProducts = (productsData.data || []).filter(
          (p: Product & { owner_id?: number }) =>
            p.owner_id === vendorId
        );
        setProducts(vendorProducts);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (vendorId) {
      fetchData();
    }
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian flex items-center justify-center">
        <DignifiedLoader
          label="جاري تحميل معلومات البائع..."
          subLabel="يتم استرجاع البيانات السيادية"
        />
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian flex flex-col items-center justify-center gap-8 px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Shield className="w-10 h-10 text-sovereign-gold/40" />
          </div>
          <h1 className="text-3xl font-black italic text-white/80 tracking-tighter">
            البائع غير موجود
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            لم نتمكن من العثور على البائع المطلوب. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
          </p>
          <SovereignButton href="/vendors" variant="secondary" size="md">
            العودة للبائعين
          </SovereignButton>
        </motion.div>
      </div>
    );
  }

  const displayName = vendor.name_ar || vendor.name;
  const displayDescription = vendor.description_ar || vendor.description;
  const vendorLogo = vendor.logo || vendor.avatar;

  const joinedYear = vendor.joined_date
    ? new Date(vendor.joined_date).getFullYear()
    : null;

  return (
    <div className="min-h-screen bg-sovereign-obsidian" dir="rtl">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
        className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden"
      >
        {/* Banner background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sovereign-gold/10 via-sovereign-obsidian to-sovereign-obsidian z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(197,160,89,0.15),transparent_60%)] z-10" />

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(197,160,89,0.4) 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }} />
        </div>

        {/* Back button */}
        <div className="absolute top-6 right-6 z-20">
          <SovereignButton href="/vendors" variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            البائعون
          </SovereignButton>
        </div>
      </motion.section>

      {/* Vendor Info Overlay */}
      <div className="relative z-20 -mt-32 sm:-mt-40 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div
          {...fadeInUp}
          className="flex flex-col sm:flex-row items-center sm:items-end gap-6"
        >
          {/* Logo */}
          <SovereignGlow color="gold" intensity="high">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-sovereign-obsidian shadow-2xl flex-shrink-0">
              {vendorLogo ? (
                <Image
                  src={vendorLogo}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sovereign-gold/10 flex items-center justify-center">
                  <span className="text-3xl font-black text-sovereign-gold">
                    {displayName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </SovereignGlow>

          {/* Name & Meta */}
          <div className="flex-1 text-center sm:text-right space-y-3 pb-2">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-white">
                {displayName}
              </h1>
              {vendor.is_verified && (
                <Badge className="bg-green-500/90 text-white border-none px-3 py-1 text-xs font-bold">
                  <Shield className="w-3 h-3 ml-1" />
                  موثق
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-white/60">
              {vendor.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-sovereign-gold text-sovereign-gold" />
                  <span className="font-bold text-white/80">{vendor.rating.toFixed(1)}</span>
                </div>
              )}
              {vendor.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{vendor.location}</span>
                </div>
              )}
              {vendor.trust_score && (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sovereign-gold" />
                  <span>ثقة {vendor.trust_score}%</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Description & Website Section */}
          <motion.div {...fadeInUp}>
            <GlassPanel variant="obsidian" className="p-6 sm:p-8">
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase tracking-[0.2em] text-sovereign-gold">
                  نبذة عن البائع
                </h2>
                {displayDescription && (
                  <p className="text-white/70 leading-relaxed text-base">
                    {displayDescription}
                  </p>
                )}

                {/* Website Button */}
                {vendor.website && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 border-sovereign-gold text-sovereign-gold hover:bg-sovereign-gold/10 transition-all duration-500"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        زيارة الموقع الإلكتروني
                      </span>
                    </a>
                  </motion.div>
                )}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Stats Row */}
          <motion.div {...fadeInUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassPanel variant="default" className="p-6 text-center">
                <Package className="w-6 h-6 text-sovereign-gold mx-auto mb-3" />
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                  {vendor.products_count ? formatNumber(vendor.products_count) : '—'}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                  منتج متاح
                </p>
              </GlassPanel>

              <GlassPanel variant="default" className="p-6 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-3" />
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                  {vendor.total_sales ? formatNumber(vendor.total_sales) : '—'}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                  عملية تأجير
                </p>
              </GlassPanel>

              <GlassPanel variant="default" className="p-6 text-center">
                <Shield className="w-6 h-6 text-sovereign-gold mx-auto mb-3" />
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                  {vendor.trust_score ? `${vendor.trust_score}%` : '—'}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                  نقطة الثقة
                </p>
              </GlassPanel>

              <GlassPanel variant="default" className="p-6 text-center">
                <Calendar className="w-6 h-6 text-sovereign-gold mx-auto mb-3" />
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                  {joinedYear || '—'}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                  عضو منذ
                </p>
              </GlassPanel>
            </div>
          </motion.div>

          {/* Products Section */}
          <motion.div {...fadeInUp}>
            <GlassPanel variant="obsidian" className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-black uppercase tracking-[0.2em] text-sovereign-gold">
                  منتجات البائع
                </h2>
                <span className="text-sm text-white/40 font-mono">
                  {products.length} منتج
                </span>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.08,
                        duration: 0.5,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <Package className="w-12 h-12 text-white/10 mx-auto" />
                  <p className="text-white/30 text-sm">
                    لا توجد منتجات معروضة حالياً لهذا البائع
                  </p>
                </div>
              )}
            </GlassPanel>
          </motion.div>

          {/* Contact / Info Section */}
          <motion.div {...fadeInUp}>
            <GlassPanel variant="default" className="p-6 sm:p-8">
              <h2 className="text-lg font-black uppercase tracking-[0.2em] text-sovereign-gold mb-6">
                معلومات التواصل
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {vendor.location && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-sovereign-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                        الموقع
                      </p>
                      <p className="text-white/70 font-medium">{vendor.location}</p>
                    </div>
                  </div>
                )}

                {vendor.website && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-sovereign-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                        الموقع الإلكتروني
                      </p>
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sovereign-gold hover:underline text-sm font-medium"
                      >
                        {vendor.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                  </div>
                )}

                {vendor.joined_date && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sovereign-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                        تاريخ الانضمام
                      </p>
                      <p className="text-white/70 font-medium">
                        {new Date(vendor.joined_date).toLocaleDateString('ar-DZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
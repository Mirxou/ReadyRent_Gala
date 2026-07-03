'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { artisansApi } from '@/lib/api';
import { Search, Star, Palette, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { TiltCard } from '@/components/ui/tilt-card';

export default function ArtisansPage() {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const { data: artisans, isLoading, isError } = useQuery({
    queryKey: ['artisans', search, selectedSpecialty],
    queryFn: () =>
      artisansApi.getAll({
        search,
        specialty: selectedSpecialty || undefined,
      }).then((res) => res.data),
  });

  const artisansList = useMemo(() => {
    if (!artisans) return [];
    return Array.isArray(artisans) ? artisans : (artisans?.results || []);
  }, [artisans]);

  const SPECIALTY_OPTIONS = [
    { value: '', label: 'الكل' },
    { value: 'dress_designer', label: 'مصممة فساتين' },
    { value: 'accessories_designer', label: 'مصممة إكسسوارات' },
    { value: 'embroidery', label: 'تطريز' },
    { value: 'beading', label: 'خرز' },
    { value: 'tailor', label: 'خياطة' },
    { value: 'other', label: 'أخرى' },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 relative z-10"
        style={{ overflow: 'visible' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
          style={{ 
            overflow: 'visible', 
            minWidth: '100%',
            padding: '4rem 6rem',
          }}
        >
          <div className="mb-6" style={{ overflow: 'visible', width: '100%' }}>
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                lineHeight: '1.5',
                padding: '2rem 6rem 2rem 1rem',
                margin: '0 auto',
                width: 'auto',
                maxWidth: '100%',
                overflow: 'visible',
                whiteSpace: 'nowrap',
              }}
            >
              أنامل ذهبية
            </h1>
          </div>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            نخبة من المصممات والحرفيات اللواتي ينسجن الإبداع في كل قطعة
          </p>
        </motion.div>

        {/* Filters */}
        <Card className="card-glass border-0 rounded-3xl mb-12 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-gala-purple/5 to-gala-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group/input">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-gala-purple transition-colors" />
                <Input
                  placeholder="ابحثي عن موهبة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-gala-purple/50 focus:border-gala-purple transition-all text-lg"
                />
              </div>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gala-purple transition-all cursor-pointer hover:bg-white/10"
              >
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <option key={specialty.value} value={specialty.value} className="bg-slate-900 text-white">
                    {specialty.label}
                  </option>
                ))}
              </select>
            </div>

            {(search || selectedSpecialty) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 flex justify-end"
              >
                <MagneticButton
                  variant="ghost"
                  size="sm"
                  className="text-gala-pink hover:text-gala-pink hover:bg-gala-pink/10"
                  onClick={() => {
                    setSearch('');
                    setSelectedSpecialty('');
                  }}
                >
                  مسح الفلاتر
                </MagneticButton>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Artisans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : isError ? (
          <Card className="card-glass">
            <CardContent className="py-12 text-center">
              <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل الحرفيات</p>
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
            </CardContent>
          </Card>
        ) : artisansList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence>
              {artisansList.map((artisan: any, index: number) => (
                <motion.div
                  key={artisan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TiltCard className="group h-full cursor-pointer hover:glow-purple">
                    <Link href={`/artisans/${artisan.id}`}>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[2.5rem]">
                        <Image
                          src={artisan.cover_image || artisan.profile_image || '/placeholder-artisan.jpg'}
                          alt={artisan.name_ar || artisan.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute top-4 left-4 flex gap-2">
                          {artisan.is_featured && (
                            <Badge className="bg-gradient-to-r from-gala-gold to-yellow-500 text-black border-0 font-bold shadow-lg">
                              مميزة
                            </Badge>
                          )}
                          {artisan.is_verified && (
                            <Badge className="bg-gala-cyan text-white border-0 font-bold shadow-lg">
                              ✓ موثقة
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-8 relative">
                        <div className="flex items-start gap-4 -mt-16 relative z-10 mb-4">
                          {artisan.profile_image && (
                            <div className="relative w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 border-4 border-[#0f172a] shadow-2xl group-hover:scale-110 transition-transform duration-500">
                              <Image
                                src={artisan.profile_image}
                                alt={artisan.name_ar}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-16">
                            <h3 className="font-bold text-2xl mb-2 line-clamp-1 group-hover:text-gala-purple transition-colors">
                              {artisan.name_ar || artisan.name}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-gala-purple/10 text-gala-purple border-gala-purple/20">
                                <Palette className="h-3 w-3 ml-1" />
                                {SPECIALTY_OPTIONS.find((s) => s.value === artisan.specialty)?.label || artisan.specialty}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {artisan.bio_ar && (
                          <p className="text-muted-foreground line-clamp-2 mb-6 text-lg leading-relaxed">
                            {artisan.bio_ar}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                          <div className="flex items-center gap-4">
                            {artisan.instagram && (
                              <MagneticButton
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-pink-600 h-10 w-10 bg-white/5 rounded-xl transition-all"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://instagram.com/${artisan.instagram.replace('@', '')}`, '_blank');
                                }}
                              >
                                <Instagram className="h-5 w-5" />
                              </MagneticButton>
                            )}
                            {artisan.facebook && (
                              <MagneticButton
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-blue-600 h-10 w-10 bg-white/5 rounded-xl transition-all"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(artisan.facebook, '_blank');
                                }}
                              >
                                <Facebook className="h-5 w-5" />
                              </MagneticButton>
                            )}
                          </div>

                          {artisan.rating && (
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-lg font-black">{Number(artisan.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 card-glass rounded-[2.5rem]"
          >
            <p className="text-2xl text-muted-foreground font-medium">عذراً، لم نجد حرفيات بهذا التصنيف حالياً.</p>
            <MagneticButton
              variant="outline"
              className="mt-8"
              onClick={() => {
                setSearch('');
                setSelectedSpecialty('');
              }}
            >
              إعادة تعيين البحث
            </MagneticButton>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}


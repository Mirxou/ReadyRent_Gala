'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { localGuideApi } from '@/lib/api';
import { Search, MapPin, Star, Phone, Mail, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { MapLocation } from '@/components/map-location';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { TiltCard } from '@/components/ui/tilt-card';

export default function LocalGuidePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showMap, setShowMap] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ['local-services', search, selectedCategory, selectedType],
    queryFn: () =>
      localGuideApi.getServices({
        search,
        category: selectedCategory || undefined,
        service_type: selectedType || undefined,
      }).then((res) => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => localGuideApi.getCategories().then((res) => res.data),
  });

  const servicesList = useMemo(() => {
    if (!services) return [];
    return Array.isArray(services) ? services : (services?.results || []);
  }, [services]);

  const SERVICE_TYPES = [
    { value: '', label: 'الكل' },
    { value: 'venue', label: 'قاعات الأفراح' },
    { value: 'photographer', label: 'مصورين' },
    { value: 'videographer', label: 'مصورين فيديو' },
    { value: 'mc', label: 'مقدمين' },
    { value: 'caterer', label: 'مطاعم' },
    { value: 'makeup_artist', label: 'مكياج' },
    { value: 'hair_stylist', label: 'تسريحات' },
    { value: 'decorator', label: 'ديكور' },
    { value: 'dj', label: 'DJ' },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
            دليـل الأفـراح
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            أرقى الخدمات المحلية لتنظيم مناسبتكم الاستثنائية في قسنطينة
          </p>
        </div>

        {/* Filters */}
        <Card className="card-glass border-0 rounded-3xl mb-12 overflow-hidden group">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group/input">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-gala-purple transition-colors" />
                <Input
                  placeholder="ابحثي عن خدمة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-gala-purple/50 focus:border-gala-purple transition-all text-lg"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gala-purple transition-all cursor-pointer hover:bg-white/10"
              >
                <option value="" className="bg-slate-900 text-white">جميع الفئات</option>
                {categories?.results?.map((cat: any) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                    {cat.name_ar}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gala-purple transition-all cursor-pointer hover:bg-white/10"
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900 text-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <MagneticButton
                  variant={showMap ? "primary" : "outline"}
                  onClick={() => setShowMap(!showMap)}
                  className="h-12 px-6 font-bold"
                >
                  <MapPin className="h-5 w-5 ml-2" />
                  {showMap ? 'إخفاء الخريطة' : 'عرض على الخريطة'}
                </MagneticButton>
              </div>

              {(search || selectedCategory || selectedType) && (
                <MagneticButton
                  variant="ghost"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setSelectedType('');
                  }}
                  className="text-gala-pink font-bold"
                >
                  مسح الفلاتر
                </MagneticButton>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map View */}
        {showMap && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gala-purple/20 text-gala-purple">
                    <MapPin className="h-6 w-6" />
                  </div>
                  المواقع الجغرافية للخدمات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <div className="h-[500px] rounded-[2rem] overflow-hidden">
                  <MapLocation readonly height="100%" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[350px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : servicesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence>
              {servicesList.map((service: any, index: number) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TiltCard className="group h-full cursor-pointer hover:glow-pink bg-black/40">
                    <Link href={`/local-guide/${service.id}`}>
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-[2.5rem]">
                        <Image
                          src={service.cover_image || service.logo || '/placeholder-service.jpg'}
                          alt={service.name_ar}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute top-4 left-4 flex gap-2">
                          {service.is_featured && (
                            <Badge className="bg-gradient-to-r from-gala-purple to-gala-pink text-white border-0 font-bold shadow-lg">
                              مميز
                            </Badge>
                          )}
                          {service.is_verified && (
                            <Badge className="bg-gala-cyan text-white border-0 font-bold shadow-lg">
                              ✓ موثق
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-2xl mb-2 group-hover:text-gala-pink transition-colors">
                              {service.name_ar || service.name}
                            </h3>
                            <Badge className="bg-white/5 text-muted-foreground border-white/10 px-3 py-1">
                              {SERVICE_TYPES.find((t) => t.value === service.service_type)?.label || service.service_type}
                            </Badge>
                          </div>
                          {service.rating && (
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-lg font-black">{Number(service.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {service.description_ar && (
                          <p className="text-muted-foreground line-clamp-2 mb-6 text-lg leading-relaxed opacity-80">
                            {service.description_ar}
                          </p>
                        )}

                        <div className="space-y-4 text-sm pt-6 border-t border-white/10">
                          {service.address && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gala-purple group-hover:scale-110 transition-transform">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <span className="text-muted-foreground font-medium line-clamp-1 pt-1">
                                {service.address}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-6">
                            {service.phone && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gala-pink group-hover:scale-110 transition-transform">
                                  <Phone className="h-4 w-4" />
                                </div>
                                <span className="text-muted-foreground font-bold">{service.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {service.price_range_min && service.price_range_max && (
                          <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-xl font-black bg-gradient-to-r from-gala-gold to-yellow-500 bg-clip-text text-transparent">
                              {service.price_range_min.toLocaleString('ar-DZ')} - {service.price_range_max.toLocaleString('ar-DZ')} دج
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 opacity-50">نطاق الأسعار التقريبي</p>
                          </div>
                        )}
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
            <p className="text-2xl text-muted-foreground font-medium">عذراً، لم نجد خدمات تطابق بحثكم حالياً.</p>
            <MagneticButton
              variant="outline"
              className="mt-8"
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedType('');
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


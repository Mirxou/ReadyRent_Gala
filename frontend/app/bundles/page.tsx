'use client';

import { useQuery } from '@tanstack/react-query';
import { bundlesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Package, Percent, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function BundlesPage() {
  const [search, setSearch] = useState('');

  const { data: bundles, isLoading, isError, error } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => bundlesApi.getAll().then((res) => res.data),
  });

  const filteredBundles = bundles?.results?.filter((bundle: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        bundle.name?.toLowerCase().includes(searchLower) ||
        bundle.description?.toLowerCase().includes(searchLower) ||
        bundle.category?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || bundles?.results || [];

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center px-6 py-8 md:px-12 md:py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gala-purple/20 mb-6">
            <Package className="h-10 w-10 text-gala-purple" />
          </div>
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
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في الحزم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الحزم...</p>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل الحزم</p>
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
            </CardContent>
          </Card>
        ) : filteredBundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBundles.map((bundle: any, index: number) => (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link href={`/bundles/${bundle.id}`}>
                    {bundle.image && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <img
                          src={bundle.image}
                          alt={bundle.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {bundle.discount_percentage > 0 && (
                          <Badge className="absolute top-4 left-4 bg-gala-pink">
                            <Percent className="h-3 w-3 mr-1" />
                            خصم {bundle.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      {bundle.category && (
                        <Badge variant="outline" className="mb-2 w-fit">
                          {bundle.category.name}
                        </Badge>
                      )}
                      <CardTitle className="group-hover:text-gala-purple transition-colors">
                        {bundle.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {bundle.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {bundle.original_price && bundle.discounted_price && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gala-purple">
                                {Number(bundle.discounted_price).toFixed(0)} دج
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                {Number(bundle.original_price).toFixed(0)} دج
                              </span>
                            </div>
                          )}
                          {bundle.items_count && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {bundle.items_count} عنصر
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-gala-purple group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد حزم متاحة حالياً</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


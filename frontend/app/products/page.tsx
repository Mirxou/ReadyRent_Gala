'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InteractiveProductCard } from '@/components/ui/interactive-product-card';
import { ParticleField } from '@/components/ui/particle-field';
import { motion } from 'framer-motion';

import { ProductFilters } from '@/components/product-filters';
import { productsApi } from '@/lib/api';
import { trackSearch } from '@/lib/analytics';
import { useEffect } from 'react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  // Get max price from metadata API (more efficient)
  const { data: metadata } = useQuery({
    queryKey: ['product-metadata'],
    queryFn: () => productsApi.getMetadata().then((res) => res.data),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Fallback: Get max price from products if metadata not available
  const { data: allProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
    select: (data) => {
      const products = Array.isArray(data) ? data : (data?.results || []);
      const prices = products.map((p: any) => Number(p.price_per_day) || 0);
      return Math.max(...prices, 50000);
    },
    enabled: !metadata?.price_range?.max, // Only fetch if metadata doesn't have max price
  });

  const maxPrice = metadata?.price_range?.max || allProducts || 50000;

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {};
    // Search: send even if empty (user can search with filters only)
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (selectedCategories.length > 0) {
      params.categories = selectedCategories;
    }
    // Price range: include if values are set
    // Only send price_min if it's greater than 0
    if (priceRange[0] !== undefined && priceRange[0] !== null && priceRange[0] > 0) {
      params.price_min = priceRange[0];
    }
    // Only send price_max if it's set and different from maxPrice (or if user entered a custom value)
    if (priceRange[1] !== undefined && priceRange[1] !== null && priceRange[1] !== maxPrice) {
      params.price_max = priceRange[1];
    }
    if (sizes.length > 0) params.sizes = sizes;
    if (colors.length > 0) params.colors = colors;
    
    return params;
  }, [search, selectedCategories, priceRange, sizes, colors, maxPrice]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsApi.getAll(queryParams).then((res) => res.data),
  });

  // Track search
  useEffect(() => {
    if (search && search.length > 2) {
      trackSearch(search);
    }
  }, [search]);

  const productsList = useMemo(() => {
    if (!products) return [];
    return Array.isArray(products) ? products : (products?.results || []);
  }, [products]);

  return (
    <div className="relative min-h-screen">
      <ParticleField />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center px-6 py-8 md:px-12 md:py-16"
        >
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
              كتالوج المنتجات
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اكتشف مجموعتنا الاستثنائية من أرقى تصاميم 2026
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <ProductFilters
                search={search}
                onSearchChange={setSearch}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                sizes={sizes}
                onSizesChange={setSizes}
                colors={colors}
                onColorsChange={setColors}
                maxPrice={maxPrice}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="h-12 w-12 rounded-full border-t-4 border-gala-purple animate-spin"></div>
                <p className="text-muted-foreground animate-pulse">جاري تنسيق القطع...</p>
              </div>
            ) : productsList.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm font-medium px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur">
                    تم العثور على <span className="text-gala-pink">{productsList.length}</span> قطعة استثنائية
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {productsList.map((product: any, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <InteractiveProductCard
                        product={product}
                        priority={index < 6}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 card-glass rounded-3xl"
              >
                <p className="text-2xl font-bold mb-2">لم نجد ما تبحث عنه</p>
                <p className="text-muted-foreground">
                  جرب تغيير معايير البحث لاكتشاف كنوز أخرى
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

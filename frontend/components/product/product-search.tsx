'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { productsApi } from '@/lib/api/products';
import type { SearchFilters } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { ProductCard } from './product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    priceMin: 0,
    priceMax: 100000,
    location: '',
    sortBy: 'newest',
  });

  const debouncedQuery = useDebounce(query, 400);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then(res => res.data),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-search', debouncedQuery, filters],
    queryFn: () => productsApi.search(debouncedQuery, filters).then(res => res.data),
  });

  const products = Array.isArray(productsData)
    ? productsData
    : (productsData as any)?.results || [];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priceMin: 0,
      priceMax: 100000,
      location: '',
      sortBy: 'newest',
    });
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن قاعات، كاميرات، فساتين..."
            className="pl-12 h-14 text-lg rounded-2xl border-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none h-14 rounded-2xl gap-2">
                <Filter className="h-5 w-5" />
                تصفية
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px]">
              <SheetHeader>
                <SheetTitle>خيارات التصفية</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-8">
                {/* Category Filter */}
                <div className="space-y-4">
                  <h4 className="font-bold">التصنيف</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((cat: any) => (
                      <Badge
                        key={cat.id}
                        variant={filters.category === cat.slug ? 'default' : 'outline'}
                        className="cursor-pointer px-4 py-2 text-sm rounded-xl"
                        onClick={() => handleFilterChange('category', cat.slug)}
                      >
                        {cat.name_ar}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sort Filter */}
                <div className="space-y-4">
                  <h4 className="font-bold">الترتيب حسب</h4>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(v) => handleFilterChange('sortBy', v)}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="اختر الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث أولاً</SelectItem>
                      <SelectItem value="price_asc">الأقل سعراً</SelectItem>
                      <SelectItem value="price_desc">الأعلى سعراً</SelectItem>
                      <SelectItem value="popularity">الأكثر شهرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full h-12 rounded-xl" onClick={clearFilters} variant="ghost">
                  <X className="h-4 w-4 ml-2" />
                  إعادة تعيين الكل
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex bg-gray-100 p-1 rounded-2xl">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-12 w-12 rounded-xl", view === 'grid' && "bg-white shadow-sm")}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-12 w-12 rounded-xl", view === 'list' && "bg-white shadow-sm")}
              onClick={() => setView('list')}
            >
              <ListIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* active filters */}
      {filters.category && (
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="px-3 py-1 gap-1">
             {filters.category}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('category', '')} />
           </Badge>
        </div>
      )}

      {/* Main Grid */}
      <div className={cn(
        "grid gap-6",
        view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
      )}>
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
                 <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">لم يتم العثور على نتائج</h3>
              <p className="text-gray-500">جرب استخدام كلمات بحث مختلفة أو تغيير الفلاتر</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

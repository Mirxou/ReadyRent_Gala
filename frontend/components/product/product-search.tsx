"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X, LayoutGrid, List as ListIcon, Sparkles, Activity, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { productsApi } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { ProductCard } from './product-card';
import { Input } from '@/components/ui/input';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import { GlassPanel } from '@/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { SovereignGlow, SovereignSparkle } from '@/components/sovereign/sovereign-sparkle';

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<any>({
    category: '',
    priceMin: 0,
    priceMax: 200000,
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

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priceMin: 0,
      priceMax: 200000,
      location: '',
      sortBy: 'newest',
    });
    setQuery('');
  };

  return (
    <div className="space-y-12" dir="rtl">
      
      {/* 🧭 Sovereign Search Bar Hub */}
      <GlassPanel className="p-8 border-white/5 bg-background/40 backdrop-blur-3xl shadow-4xl" gradientBorder>
          <div className="flex flex-col md:flex-row gap-8 items-center">
             
             {/* The Intelligence Input */}
             <div className="relative w-full max-w-3xl group">
                <div className="absolute inset-0 bg-sovereign-gold/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-sovereign-gold transition-colors" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث في سجل الأصول السيادية (فساتين، إكسسوارات، قاعات...)"
                    className="pr-16 h-16 text-lg rounded-[2rem] border-white/5 bg-black/20 focus:border-sovereign-gold/40 transition-all font-black placeholder:text-muted-foreground/40 italic"
                />
             </div>

             {/* Tactical Tools */}
             <div className="flex items-center gap-4 w-full md:w-auto">
                <Sheet>
                   <SheetTrigger asChild>
                      <SovereignButton variant="secondary" className="h-16 px-8 rounded-2xl gap-3 flex-1 md:flex-none">
                         <Filter className="w-5 h-5" /> تصفية السجل
                      </SovereignButton>
                   </SheetTrigger>
                   <SheetContent side="right" className="w-full md:w-[450px] bg-background border-white/5 p-10" dir="rtl">
                      <SheetHeader className="mb-12">
                         <SheetTitle className="text-3xl font-black italic">بروتوكول التصفية السيادي</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-12">
                         {/* Category Filter */}
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">أصناف الأصول (Categories)</h4>
                            <div className="flex flex-wrap gap-3">
                               {categories?.map((cat: any) => (
                                 <Badge
                                   key={cat.id}
                                   variant="outline"
                                   className={cn(
                                     "cursor-pointer px-5 py-2.5 text-xs font-bold rounded-xl transition-all",
                                     filters.category === cat.slug ? "bg-sovereign-gold text-black border-sovereign-gold" : "hover:bg-white/5 border-white/5"
                                   )}
                                   onClick={() => handleFilterChange('category', cat.slug)}
                                 >
                                   {cat.name_ar}
                                 </Badge>
                               ))}
                            </div>
                         </div>

                         {/* Sort Options */}
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">منطق الترتيب (Sort Engine)</h4>
                            <div className="grid grid-cols-2 gap-4">
                               {[
                                 { label: 'الأحدث سيادياً', value: 'newest' },
                                 { label: 'الأكثر نيلاً للثقة', value: 'popularity' },
                                 { label: 'القيمة (الأقل)', value: 'price_asc' },
                                 { label: 'القيمة (الأعلى)', value: 'price_desc' }
                               ].map(opt => (
                                 <button
                                   key={opt.value}
                                   onClick={() => handleFilterChange('sortBy', opt.value)}
                                   className={cn(
                                     "p-4 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all",
                                     filters.sortBy === opt.value ? "border-sovereign-gold bg-sovereign-gold/10 text-sovereign-gold" : "border-white/5 hover:bg-white/5"
                                   )}
                                 >
                                   {opt.label}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="pt-10 border-t border-white/5">
                            <SovereignButton onClick={clearFilters} variant="secondary" className="w-full h-14 rounded-xl gap-3">
                               <X className="w-4 h-4" /> إعادة ضبط البروتوكول
                            </SovereignButton>
                         </div>
                      </div>
                   </SheetContent>
                </Sheet>

                {/* View Switchers */}
                <div className="hidden md:flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
                   <button 
                     onClick={() => setView('grid')}
                     className={cn("p-4 rounded-xl transition-all", view === 'grid' ? "bg-sovereign-gold text-black shadow-3xl" : "text-muted-foreground hover:text-foreground")}
                   >
                      <LayoutGrid className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => setView('list')}
                     className={cn("p-4 rounded-xl transition-all", view === 'list' ? "bg-sovereign-gold text-black shadow-3xl" : "text-muted-foreground hover:text-foreground")}
                   >
                      <ListIcon className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">System Status:</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1">Ready to Lease</Badge>
             </div>
             {filters.category && (
                <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold bg-sovereign-gold/5 px-4 py-1.5 gap-2 font-black italic">
                   تجميع حسب: {filters.category}
                   <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('category', '')} />
                </Badge>
             )}
          </div>
      </GlassPanel>

      {/* 🚀 Main Search Results */}
      <div className={cn(
        "grid gap-10",
        view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
      )}>
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <GlassPanel key={i} className="aspect-[3/4] p-0" gradientBorder>
                 <Skeleton className="w-full h-full rounded-[2.5rem] bg-white/5" />
              </GlassPanel>
            ))
          ) : products.length > 0 ? (
            products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="col-span-full py-40 text-center space-y-8"
            >
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground/20">
                  <Activity className="w-12 h-12" />
               </div>
               <div className="space-y-2">
                   <h3 className="text-3xl font-black italic">لم يتم رصد نتائج في الأرشيف</h3>
                   <p className="text-muted-foreground italic text-sm">جرب استخدام ميثاق بحث مختلف (فساتين، قاعات، كاميرات...)</p>
               </div>
               <SovereignButton onClick={clearFilters} variant="secondary">العودة لتصفح السجل الكامل</SovereignButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

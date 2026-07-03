'use client';

import { useEffect, useState } from 'react';
import { productsApi, Product } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        // Fetch latest/popular items (assuming no filter brings latest)
        const res = await productsApi.search('', { sortBy: 'newest' }, 1);
        if (res?.data && Array.isArray(res.data)) {
          setProducts(res.data.slice(0, 3)); // show top 3
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Return nothing if no products available from backend
  }

  return (
    <section className="py-20 px-6 relative z-10 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">التشكيلة الحصرية</h2>
          <div className="h-1 w-24 bg-sovereign-gold mx-auto rounded-full" />
          <p className="text-muted-foreground mt-4">نخبة المعروضات السيادية المتاحة حالياً للحجز</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

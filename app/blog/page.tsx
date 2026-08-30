'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Clock, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { blogApi } from '@/lib/api';

const POSTS_PER_PAGE = 6;

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog-posts', page, search],
    queryFn: () =>
      blogApi
        .getAll({ page: String(page), limit: String(POSTS_PER_PAGE), search: search || undefined })
        .then((res) => {
          // apiFetch silently catches errors — detect them via meta
          if (res.meta && (res.meta as Record<string, unknown>).failed) {
            throw new Error('API error');
          }
          const raw = Array.isArray(res.data) ? res.data : [];
          const mapped = raw.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            title: p.title as string,
            excerpt: (p.excerpt as string) || '',
            date: (p.created_at as string) || '',
            category: (p.category as string) || 'عام',
            readTime: `${p.read_time || 1} دقائق`,
            image: (p.featured_image as string) || null,
          }));
          return { posts: mapped, meta: (res.meta || {}) as Record<string, number> };
        }),
  });

  const posts = data?.posts ?? [];
  const meta = data?.meta ?? {};
  const totalPages = (meta.total_pages as number) || 1;
  const isSearchActive = search.trim().length > 0;

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="relative min-h-screen" dir="rtl">
      <ParticleField />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-6" style={{ overflow: 'visible', width: '100%' }}>
            <h1
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(to right, #C5A059, #EC4899, #F59E0B)',
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
              المدونة
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اكتشف آخر الأخبار والنصائح حول الموضة والأناقة
          </p>
        </motion.div>

        {/* Search */}
        <GlassPanel className="mb-8 !rounded-2xl !p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في المدونة..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-10 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
        </GlassPanel>

        {isLoading ? (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <p className="text-muted-foreground">جاري تحميل المقالات...</p>
          </GlassPanel>
        ) : isError ? (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <p className="text-red-400">حدث خطأ أثناء تحميل المقالات. يرجى المحاولة لاحقاً.</p>
          </GlassPanel>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/blog/${post.id}`} className="block h-full">
                  <SovereignGlow color="purple" intensity="low">
                    <GlassPanel
                      variant="obsidian"
                      className="!rounded-2xl !p-0 overflow-hidden cursor-pointer group h-full"
                    >
                      <div className="relative h-52 w-full overflow-hidden bg-muted/30">
                        <Image
                          src={post.image || '/placeholder.svg'}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          fill
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-sovereign-gold/90 text-white border-0">
                            {post.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-3 group-hover:text-sovereign-gold transition-colors leading-relaxed">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(post.date).toLocaleDateString('ar-DZ')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          <ArrowLeft className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </GlassPanel>
                  </SovereignGlow>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-border hover:border-sovereign-gold hover:text-sovereign-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                      p === page
                        ? 'bg-sovereign-gold text-sovereign-black'
                        : 'border border-border hover:border-sovereign-gold hover:text-sovereign-gold'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-border hover:border-sovereign-gold hover:text-sovereign-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <p className="text-muted-foreground">
              {isSearchActive ? 'لا توجد مقالات مطابقة لبحثك' : 'لا توجد مقالات بعد'}
            </p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

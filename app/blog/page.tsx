'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { useState } from 'react';

const blogPosts = [
  { id: 1, title: 'أحدث صيحات الموضة لعرس 2026', excerpt: 'اكتشفي أحدث الاتجاهات في عالم أزياء الأعراس الجزائرية والعالمية لسنة 2026.', date: '2026-01-15', category: 'موضة', readTime: '5 دقائق', image: 'https://picsum.photos/seed/blog1/600/400' },
  { id: 2, title: 'دليل اختيار الفستان المثالي', excerpt: 'نصائح ذهبية لاختيار الفستان الذي يناسب قامتك ولون بشرتك ومناسبتك.', date: '2026-01-10', category: 'نصائح', readTime: '7 دقائق', image: 'https://picsum.photos/seed/blog2/600/400' },
  { id: 3, title: 'قفطان جزائري: تراث وتحديث', excerpt: 'رحلة القفطان الجزائري من التقليد إلى الموضة العصرية مع الحفاظ على الهوية.', date: '2026-01-05', category: 'تراث', readTime: '8 دقائق', image: 'https://picsum.photos/seed/blog3/600/400' },
  { id: 4, title: 'كيف تجهزين لعرسك في الجزائر', excerpt: 'دليل شامل لتحضيرات العرس من اختيار الفستان إلى تنسيق الحفل.', date: '2025-12-28', category: 'أعراس', readTime: '10 دقائق', image: 'https://picsum.photos/seed/blog4/600/400' },
];

export default function BlogPage() {
  const [search, setSearch] = useState('');

  const filteredPosts = blogPosts.filter((post) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.category.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
        </GlassPanel>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPosts.map((post, index) => (
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
                    <div className="relative h-52 w-full overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                            <span>{new Date(post.date).toLocaleDateString('ar-EG')}</span>
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
        ) : (
          <GlassPanel variant="obsidian" className="!rounded-2xl text-center !p-12">
            <p className="text-muted-foreground">لا توجد مقالات مطابقة لبحثك</p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
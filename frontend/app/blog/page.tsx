'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { useState } from 'react';

export default function BlogPage() {
  const [search, setSearch] = useState('');

  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => cmsApi.getBlogPosts({ status: 'published' }).then((res) => res.data),
  });

  const filteredPosts = posts?.results?.filter((post: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        post.title?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || posts?.results || [];

  return (
    <div className="relative min-h-screen">
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
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في المدونة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل المقالات...</p>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل المقالات</p>
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
            </CardContent>
          </Card>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: any, index: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link href={`/blog/${post.id}`}>
                    {post.featured_image && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {post.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="group-hover:text-gala-purple transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt || post.content?.substring(0, 150)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {post.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{post.author}</span>
                            </div>
                          )}
                          {post.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(post.published_at).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
              <p className="text-muted-foreground">لا توجد مقالات متاحة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


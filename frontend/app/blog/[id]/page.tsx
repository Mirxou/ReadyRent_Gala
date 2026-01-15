'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { Button } from '@/components/ui/button';

export default function BlogPostPage() {
  const params = useParams();
  const postId = params.id as string;

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', postId],
    queryFn: () => cmsApi.getBlogPost(Number(postId)).then((res) => res.data),
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل المقال...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">المقال غير موجود</p>
              <Button asChild className="mt-4">
                <Link href="/blog">العودة للمدونة</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للمدونة
            </Link>
          </Button>

          {post.featured_image && (
            <div className="relative h-96 w-full overflow-hidden rounded-2xl mb-8">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            {post.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{
              background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              lineHeight: '1.5',
              padding: '1rem 2rem',
              overflow: 'visible',
            }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
            {post.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.published_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="pt-8">
              <div
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-gala-purple prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: post.content || '' }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


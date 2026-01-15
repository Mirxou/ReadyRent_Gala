'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: () => cmsApi.getPages({ slug }).then((res) => res.data?.results?.[0]),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الصفحة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">الصفحة غير موجودة</p>
              <Button asChild className="mt-4">
                <Link href="/">العودة للصفحة الرئيسية</Link>
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
            <Link href="/" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للصفحة الرئيسية
            </Link>
          </Button>

          {page.featured_image && (
            <div className="relative h-64 w-full overflow-hidden rounded-2xl mb-8">
              <img
                src={page.featured_image}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 
            className="text-4xl md:text-5xl font-bold mb-8"
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
            {page.title}
          </h1>

          <Card>
            <CardContent className="pt-8">
              <div
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-gala-purple prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: page.content || '' }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


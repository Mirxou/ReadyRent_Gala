'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { cmsApi } from '@/lib/api';
import DOMPurify from 'dompurify';

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'width', 'height', 'loading'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: () => cmsApi.getBySlug(slug),
    enabled: !!slug,
  });

  // CMS-BUG-1 FIX: detect apiFetch failure via meta.failed + extract actual page data
  const metaFailed = res?.meta && typeof res.meta === 'object' && 'failed' in res.meta && (res.meta as { failed: boolean }).failed;
  const page = (metaFailed || !res?.data || typeof res.data !== 'object' || Array.isArray(res.data) || !('title' in res.data))
    ? null
    : res.data as { id: string; title: string; slug: string; content: string; status: string };

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

  if (!page || isError) {
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

          {/* CMS-BUG-4 FIX: removed dead featured_image section — field doesn't exist in CMSPage model */}

          <h1 
            className="text-4xl md:text-5xl font-bold mb-8"
            style={{
              background: 'linear-gradient(to right, #C5A059, #D4AF37, #E8C547)',
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
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-sovereign-gold prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content || '', DOMPURIFY_CONFIG) }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
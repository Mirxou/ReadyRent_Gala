'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import DOMPurify from 'dompurify';

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'width', 'height', 'loading'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, 'https://picsum.photos');
    const allowedHosts = ['picsum.photos', 'images.unsplash.com', 'res.cloudinary.com', 'amazonaws.com', 'localhost'];
    return allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: () => fetch('/api/cms/pages/' + slug).then(r => r.json()).then(d => d.data || d).then(d => Array.isArray(d) ? d[0] : d),
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
                src={isValidImageUrl(page.featured_image) ? page.featured_image : '/placeholder.svg'}
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
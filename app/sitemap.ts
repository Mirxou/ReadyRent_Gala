import { MetadataRoute } from 'next';
import { productsApi } from '@/lib/api/products';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://standard.rent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages including new Sovereign features
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ai-search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/judicial`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trust-score`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bundles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/local-guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/artisans`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Try to fetch dynamic products if environment allows
  const isProduction = process.env.NODE_ENV === 'production';
  const hasExternalApi = process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost');

  if (isProduction && hasExternalApi) {
    try {
      const resp = await productsApi.search('', {}).catch(() => ({ data: [] as any[] }));
      const products: any[] = Array.isArray(resp.data) ? resp.data : (resp.data as any)?.results ?? [];

      const productPages: MetadataRoute.Sitemap = products.map((p: any) => ({
        url: `${baseUrl}/products/${p.slug || p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

      return [...staticPages, ...productPages];
    } catch {
      return staticPages;
    }
  }

  return staticPages;
}

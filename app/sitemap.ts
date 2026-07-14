import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://standard.rent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/rentals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/bundles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/artisans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/vendors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/subscriptions`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/insurance`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/trust-score`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Dynamic pages from database
  try {
    const [products, blogPosts, artisans, vendors] = await Promise.all([
      db.product.findMany({ select: { id: true, updatedAt: true }, take: 100 }),
      db.blogPost.findMany({ where: { status: 'published' }, select: { id: true, updatedAt: true }, take: 50 }),
      db.artisan.findMany({ select: { id: true, updatedAt: true }, take: 50 }),
      db.vendor.findMany({ select: { id: true, updatedAt: true }, take: 50 }),
    ]);

    const dynamicPages: MetadataRoute.Sitemap = [
      ...products.map(p => ({ url: `${baseUrl}/products/${p.id}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
      ...blogPosts.map(p => ({ url: `${baseUrl}/blog/${p.id}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.6 })),
      ...artisans.map(a => ({ url: `${baseUrl}/artisans/${a.id}`, lastModified: a.updatedAt, changeFrequency: 'weekly' as const, priority: 0.6 })),
      ...vendors.map(v => ({ url: `${baseUrl}/vendors/${v.id}`, lastModified: v.updatedAt, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ];

    return [...staticPages, ...dynamicPages];
  } catch {
    return staticPages;
  }
}
import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const BASE_URL = 'https://standard.rent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ──── Static Pages ────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/rentals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/marketplace`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/bundles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/artisans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/vendors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/insurance`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/subscriptions`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/trust-score`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/disputes`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/social`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/verification`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // ──── Dynamic Pages (DB-driven) ────
  try {
    const [products, bundles, artisans, vendors, blogPosts] = await Promise.all([
      db.product.findMany({
        where: { isAvailable: true },
        select: { id: true, updatedAt: true },
      }),
      db.bundle.findMany({ select: { id: true } }),
      db.artisan.findMany({ select: { id: true } }),
      db.vendor.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
      db.blogPost.findMany({
        where: { status: 'published' },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const dynamicPages: MetadataRoute.Sitemap = [
      ...products.map((p) => ({
        url: `${BASE_URL}/products/${p.id}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...bundles.map((b) => ({
        url: `${BASE_URL}/bundles/${b.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...artisans.map((a) => ({
        url: `${BASE_URL}/artisans/${a.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...vendors.map((v) => ({
        url: `${BASE_URL}/vendors/${v.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...blogPosts.map((b) => ({
        url: `${BASE_URL}/blog/${b.id}`,
        lastModified: b.updatedAt || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];

    return [...staticPages, ...dynamicPages];
  } catch {
    // Fallback: return static pages only if DB fails
    return staticPages;
  }
}
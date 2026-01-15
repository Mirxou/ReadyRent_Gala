import { MetadataRoute } from 'next';
import { productsApi, cmsApi, bundlesApi } from '@/lib/api';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://readyrent.gala';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
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
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Fetch all products
    const productsResponse = await productsApi.getAll();
    const products = Array.isArray(productsResponse.data) 
      ? productsResponse.data 
      : productsResponse.data?.results || [];

    // Generate product pages
    const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
      url: `${baseUrl}/products/${product.slug || product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Fetch categories if available
    const categoriesResponse = await productsApi.getCategories();
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];

    // Generate category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
      url: `${baseUrl}/products?category=${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Fetch blog posts
    let blogPages: MetadataRoute.Sitemap = [];
    try {
      const blogResponse = await cmsApi.getBlogPosts({ published: true });
      const blogPosts = Array.isArray(blogResponse.data)
        ? blogResponse.data
        : blogResponse.data?.results || [];
      blogPages = blogPosts.map((post: any) => ({
        url: `${baseUrl}/blog/${post.id}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }

    // Fetch bundles
    let bundlePages: MetadataRoute.Sitemap = [];
    try {
      const bundlesResponse = await bundlesApi.getAll({ active: true });
      const bundles = Array.isArray(bundlesResponse.data)
        ? bundlesResponse.data
        : bundlesResponse.data?.results || [];
      bundlePages = bundles.map((bundle: any) => ({
        url: `${baseUrl}/bundles/${bundle.id}`,
        lastModified: bundle.updated_at ? new Date(bundle.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }

    // Fetch CMS pages
    let cmsPages: MetadataRoute.Sitemap = [];
    try {
      const pagesResponse = await cmsApi.getPages({ published: true });
      const pages = Array.isArray(pagesResponse.data)
        ? pagesResponse.data
        : pagesResponse.data?.results || [];
      cmsPages = pages.map((page: any) => ({
        url: `${baseUrl}/pages/${page.slug}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    } catch (error) {
      console.error('Error fetching CMS pages:', error);
    }

    return [
      ...staticPages,
      ...productPages,
      ...categoryPages,
      ...blogPages,
      ...bundlePages,
      ...cmsPages,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}


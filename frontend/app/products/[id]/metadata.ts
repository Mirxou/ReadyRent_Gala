import { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://readyrent.gala';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productsApi.getBySlug(id).then(res => res.data);
    
    const primaryImage = product.primary_image || 
                         product.images?.find((img: any) => img.is_primary)?.image ||
                         product.images?.[0]?.image ||
                         `${baseUrl}/placeholder-dress.jpg`;
    
    const imageUrl = primaryImage.startsWith('http') ? primaryImage : `${baseUrl}${primaryImage}`;

    return {
      title: `${product.name_ar || product.name} - ReadyRent.Gala`,
      description: product.description_ar || product.description || 'اكتشف هذا المنتج من ReadyRent.Gala',
      keywords: [
        product.name_ar || product.name,
        product.category?.name_ar || product.category?.name || '',
        'كراء فساتين',
        'إيجار فساتين',
        'مناسبات',
        'قسنطينة'
      ],
      openGraph: {
        title: `${product.name_ar || product.name} - ReadyRent.Gala`,
        description: product.description_ar || product.description || 'اكتشف هذا المنتج من ReadyRent.Gala',
        url: `${baseUrl}/products/${product.slug || product.id}`,
        siteName: 'ReadyRent.Gala',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name_ar || product.name,
          },
        ],
        locale: 'ar_DZ',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name_ar || product.name} - ReadyRent.Gala`,
        description: product.description_ar || product.description || 'اكتشف هذا المنتج من ReadyRent.Gala',
        images: [imageUrl],
      },
      alternates: {
        canonical: `/products/${product.slug || product.id}`,
      },
    };
  } catch (error) {
    return {
      title: 'المنتج - ReadyRent.Gala',
      description: 'اكتشف المنتج من ReadyRent.Gala',
    };
  }
}


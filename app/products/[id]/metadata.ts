import { Metadata } from 'next';
import { db } from '@/lib/db';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://standard.rent';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: { category: { select: { nameAr: true, nameEn: true } } },
    });

    if (!product) {
      return {
        title: 'المنتج - STANDARD.Rent',
        description: 'اكتشف المنتج من STANDARD.Rent',
      };
    }

    const primaryImage = product.primaryImage || product.images?.[0] || `${baseUrl}/placeholder-dress.jpg`;
    const imageUrl = primaryImage.startsWith('http') ? primaryImage : `${baseUrl}${primaryImage}`;

    return {
      title: `${product.nameAr || product.name} - STANDARD.Rent`,
      description: product.description || 'اكتشف هذا المنتج من STANDARD.Rent',
      keywords: [
        product.nameAr || product.name,
        product.category?.nameAr || product.category?.nameEn || '',
        'كراء فساتين',
        'إيجار فساتين',
        'مناسبات',
        'قسنطينة'
      ],
      openGraph: {
        title: `${product.nameAr || product.name} - STANDARD.Rent`,
        description: product.description || 'اكتشف هذا المنتج من STANDARD.Rent',
        url: `${baseUrl}/products/${product.slug || product.id}`,
        siteName: 'STANDARD.Rent',
        images: [{ url: imageUrl, width: 1200, height: 630, alt: product.nameAr || product.name }],
        locale: 'ar_DZ',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.nameAr || product.name} - STANDARD.Rent`,
        description: product.description || 'اكتشف هذا المنتج من STANDARD.Rent',
        images: [imageUrl],
      },
      alternates: {
        canonical: `/products/${product.slug || product.id}`,
      },
    };
  } catch {
    return {
      title: 'المنتج - STANDARD.Rent',
      description: 'اكتشف المنتج من STANDARD.Rent',
    };
  }
}
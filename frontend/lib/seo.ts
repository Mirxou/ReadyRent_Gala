/**
 * SEO utilities for generating structured data and meta tags
 */

interface Product {
  id: number;
  name: string;
  name_ar: string;
  description: string;
  description_ar?: string;
  price_per_day: number;
  category?: {
    name: string;
    name_ar: string;
  };
  images?: Array<{
    image: string;
    is_primary: boolean;
  }>;
  primary_image?: string;
  rating?: number;
  slug: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate Product structured data (JSON-LD) for SEO
 */
export function generateProductSchema(product: Product, baseUrl: string = 'https://readyrent.gala') {
  const primaryImage = product.primary_image || 
                       product.images?.find(img => img.is_primary)?.image ||
                       product.images?.[0]?.image ||
                       `${baseUrl}/placeholder-dress.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name_ar || product.name,
    description: product.description_ar || product.description,
    image: primaryImage.startsWith('http') ? primaryImage : `${baseUrl}${primaryImage}`,
    sku: `PROD-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'ReadyRent.Gala'
    },
    category: product.category?.name_ar || product.category?.name || 'Dress Rental',
    offers: {
      '@type': 'Offer',
      price: product.price_per_day,
      priceCurrency: 'DZD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/products/${product.slug || product.id}`
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      ratingCount: 1
    } : undefined
  };
}

/**
 * Generate Breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string = 'https://readyrent.gala') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  };
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationSchema(baseUrl: string = 'https://readyrent.gala') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ReadyRent.Gala',
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    description: 'منصة متكاملة لكراء الفساتين ومستلزمات المناسبات في قسنطينة والجزائر',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Constantine',
      addressCountry: 'DZ'
    },
    sameAs: [
      // Add social media links here when available
    ]
  };
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema(baseUrl: string = 'https://readyrent.gala') {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_PHONE_NUMBER || '+213XXXXXXXXX';
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'ReadyRent.Gala',
    image: `${baseUrl}/icons/icon-512x512.png`,
    '@id': baseUrl,
    url: baseUrl,
    telephone: phoneNumber,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Constantine',
      addressRegion: 'Constantine',
      addressCountry: 'DZ'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 36.3650,
      longitude: 6.6147
    }
  };
}


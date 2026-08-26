// ═══════════════════════════════════════════════════════════════════
// Homepage SSR Data — Direct DB queries (no HTTP round-trip)
// Called from app/page.tsx (Server Component) at request time.
// ═══════════════════════════════════════════════════════════════════

import { db } from '@/lib/db';

/* ──── Types ──── */

export interface HomepageProduct {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string | null;
  price_per_day: number;
  images: Array<{ image?: string; url?: string }>;
  primary_image: string | null;
  category: { name_ar: string } | null;
  location_name: string | null;
  is_available: boolean;
  rating: number;
  trust_score: number;
  is_premium: boolean;
  is_verified: boolean;
  listing_type: string;
  deposit_amount: number;
  created_at: string;
}

export interface HomepageArtisan {
  id: string;
  name: string;
  name_ar: string;
  specialty: string | null;
  specialty_ar: string | null;
  rating: number;
  location: string | null;
  avatar: string | null;
  image: string | null;
  is_verified: boolean;
  trust_score: number;
  completed_orders: number;
}

export interface HomepageReview {
  id: string;
  user_id: string;
  booking_id: string | null;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  user: { id: string; username: string } | null;
}

export interface HomepageStats {
  total_products: number;
  total_artisans: number;
  total_services: number;
  total_users: number;
}

export interface HomepageData {
  products: HomepageProduct[];
  artisans: HomepageArtisan[];
  reviews: HomepageReview[];
  stats: HomepageStats;
}

/* ──── Helpers ──── */

function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function transformProduct(p: {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string | null;
  pricePerDay: number;
  images: string;
  primaryImage: string | null;
  locationName: string | null;
  isAvailable: boolean;
  rating: number;
  trustScore: number;
  isPremium: boolean;
  isVerified: boolean;
  listingType: string;
  depositAmount: number;
  createdAt: Date;
  category: { nameAr: string } | null;
}): HomepageProduct {
  return {
    id: p.id,
    name: p.name,
    name_ar: p.nameAr,
    slug: p.slug,
    description: p.description,
    price_per_day: p.pricePerDay,
    images: safeJsonParse(p.images, []),
    primary_image: p.primaryImage,
    category: p.category ? { name_ar: p.category.nameAr } : null,
    location_name: p.locationName,
    is_available: p.isAvailable,
    rating: p.rating,
    trust_score: p.trustScore,
    is_premium: p.isPremium,
    is_verified: p.isVerified,
    listing_type: p.listingType,
    deposit_amount: p.depositAmount,
    created_at: p.createdAt.toISOString(),
  };
}

/* ──── Main fetcher ──── */

export async function getHomepageData(): Promise<HomepageData> {
  const [products, artisans, reviews, totalProducts, totalArtisans, totalServices, totalUsers] =
    await Promise.all([
      // Featured products (3 newest)
      db.product.findMany({
        include: {
          category: { select: { nameAr: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),

      // Artisans (4 newest)
      db.artisan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),

      // Latest approved reviews (3)
      db.review.findMany({
        where: { status: 'approved' },
        include: {
          user: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),

      // Stats — 4 parallel counts
      db.product.count(),
      db.artisan.count(),
      db.localGuideService.count(),
      db.user.count(),
    ]);

  return {
    products: products.map(transformProduct),
    artisans: artisans.map((a) => ({
      id: a.id,
      name: a.name,
      name_ar: a.nameAr,
      specialty: a.specialty,
      specialty_ar: a.specialtyAr,
      rating: a.rating,
      location: a.location,
      avatar: a.avatar,
      image: a.avatar, // fallback alias
      is_verified: a.isVerified,
      trust_score: a.trustScore,
      completed_orders: a.completedOrders,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      user_id: r.userId,
      booking_id: r.bookingId,
      product_id: r.productId,
      reviewer_name: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      is_verified: r.isVerified,
      status: r.status,
      created_at: r.createdAt.toISOString(),
      user: r.user ? { id: r.user.id, username: r.user.username } : null,
    })),
    stats: {
      total_products: totalProducts,
      total_artisans: totalArtisans,
      total_services: totalServices,
      total_users: totalUsers,
    },
  };
}

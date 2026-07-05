import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  products,
  vendors,
  artisans,
  bundles,
  reviews,
} from '@/lib/mock-data';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ──── In-Memory Rate Limiter ────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // per window (general)
const AUTH_RATE_LIMIT_MAX = 5; // stricter for auth endpoints

function rateLimit(key: string, max: number = RATE_LIMIT_MAX): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// ──── Auth Helper ────
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAuthenticated(request: NextRequest): boolean {
  return !!getAuthToken(request);
}

function isAdmin(request: NextRequest): boolean {
  // In mock mode, check for admin token or role header
  const token = getAuthToken(request);
  return token === 'mock-jwt-token-admin' || request.headers.get('x-mock-role') === 'admin';
}

function sanitizeString(val: any, maxLength: number = 500): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLength).replace(/[<>'"&]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
  }[c] || c));
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return {};
  const sanitized: any = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, 2000);
    } else if (typeof value === 'number' && isFinite(value)) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeString(v, 500) : v);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// =============================================================================
// Local Guide Mock Data
// =============================================================================
const localGuideCategories = [
  { id: 1, name_ar: 'تصوير مناسبات', name_en: 'Event Photography', slug: 'photography', icon: 'Camera', service_count: 3 },
  { id: 2, name_ar: 'مكياج وتجميل', name_en: 'Makeup & Beauty', slug: 'makeup', icon: 'Sparkles', service_count: 2 },
  { id: 3, name_ar: 'ديجي وموسيقى', name_en: 'DJ & Music', slug: 'dj', icon: 'Music', service_count: 2 },
  { id: 4, name_ar: 'قاعات الأفراح', name_en: 'Wedding Halls', slug: 'halls', icon: 'Building2', service_count: 2 },
  { id: 5, name_ar: 'ديكور وزينة', name_en: 'Decoration', slug: 'decoration', icon: 'Flower2', service_count: 2 },
  { id: 6, name_ar: 'حفلات وأفراح', name_en: 'Party Planning', slug: 'party-planning', icon: 'PartyPopper', service_count: 1 },
  { id: 7, name_ar: 'تصوير فيديو', name_en: 'Videography', slug: 'videography', icon: 'Video', service_count: 1 },
  { id: 8, name_ar: 'طباخين وحلويات', name_en: 'Chefs & Pastries', slug: 'catering', icon: 'ChefHat', service_count: 1 },
];

const localGuideServices = [
  {
    id: 1,
    name_ar: 'ستوديو النور للتصوير',
    name_en: 'Studio El Nor Photography',
    category: 'تصوير مناسبات',
    category_slug: 'photography',
    city: 'الجزائر العاصمة',
    rating: 4.9,
    review_count: 127,
    price_range: '15000 - 35000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'فريق تصوير احترافي متخصص في الأعراس والمناسبات. تصوير فني إبداعي مع أحدث المعدات الرقمية ومعرض صور رقمي فوري.',
    description_en: 'Professional photography team specializing in weddings and events. Artistic creative photography with the latest digital equipment and instant digital gallery.',
    phone: '0661 789 012',
    whatsapp: '213661789012',
    is_verified: true,
    featured: true,
  },
  {
    id: 2,
    name_ar: 'مكياج أمينة',
    name_en: 'Makeup by Amina',
    category: 'مكياج وتجميل',
    category_slug: 'makeup',
    city: 'وهران',
    rating: 4.8,
    review_count: 89,
    price_range: '15000 - 40000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'خبيرة مكياج محترفة مع 8 سنوات خبرة. متخصصة في مكياج العروس باستخدام أجود المنتجات العالمية.',
    description_en: 'Professional makeup artist with 8 years of experience. Specialized in bridal makeup using the finest international products.',
    phone: '0770 345 678',
    whatsapp: '213770345678',
    is_verified: true,
    featured: true,
  },
  {
    id: 3,
    name_ar: 'دي جي كريم',
    name_en: 'DJ Karim Events',
    category: 'ديجي وموسيقى',
    category_slug: 'dj',
    city: 'البليدة',
    rating: 4.6,
    review_count: 64,
    price_range: '25000 - 80000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'دي جي محترف مع أحدث المعدات الصوتية والإضاءة. مزيج فريد من الموسيقى الجزائرية التقليدية والحديثة.',
    description_en: 'Professional DJ with the latest sound and lighting equipment. Unique blend of traditional and modern Algerian music.',
    phone: '0542 567 890',
    whatsapp: '213542567890',
    is_verified: true,
    featured: false,
  },
  {
    id: 4,
    name_ar: 'دار العروس قسنطينة',
    name_en: 'Dar El Arous Constantine',
    category: 'قاعات الأفراح',
    category_slug: 'halls',
    city: 'قسنطينة',
    rating: 4.8,
    review_count: 203,
    price_range: '150000 - 300000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'قاعة أفراح فاخرة في قلب قسنطينة تتسع لـ 500 ضيف. ديكور راقي وخدمات شاملة تتضمن الضيافة والتنسيق.',
    description_en: 'Luxury wedding hall in the heart of Constantine accommodating up to 500 guests. Elegant decor and comprehensive services including catering and coordination.',
    phone: '0555 123 456',
    whatsapp: '213555123456',
    is_verified: true,
    featured: true,
  },
  {
    id: 5,
    name_ar: 'ورود ذهبية للديكور',
    name_en: 'Golden Roses Decoration',
    category: 'ديكور وزينة',
    category_slug: 'decoration',
    city: 'عنابة',
    rating: 4.5,
    review_count: 56,
    price_range: '20000 - 80000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'فريق ديكور محترف متخصص في زينة الأعراس والمناسبات. تنسيق زهور فاخر وتصميم أجواء ساحرة.',
    description_en: 'Professional decoration team specializing in wedding and event styling. Luxury floral arrangements and magical atmosphere design.',
    phone: '0698 234 567',
    whatsapp: '213698234567',
    is_verified: true,
    featured: false,
  },
  {
    id: 6,
    name_ar: 'سناب للتصوير',
    name_en: 'Snap Wedding Photography',
    category: 'تصوير مناسبات',
    category_slug: 'photography',
    city: 'قسنطينة',
    rating: 4.7,
    review_count: 98,
    price_range: '20000 - 50000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'فريق تصوير متخصص في أعراس المغرب العربي. تصوير جوي بالدرون وألبومات رقمية فاخرة.',
    description_en: 'Photography team specialized in Maghreb weddings. Aerial drone photography and luxury digital albums.',
    phone: '0664 123 456',
    whatsapp: '213664123456',
    is_verified: true,
    featured: true,
  },
  {
    id: 7,
    name_ar: 'إيفانتس برو سطيف',
    name_en: 'Events Pro Sétif',
    category: 'حفلات وأفراح',
    category_slug: 'party-planning',
    city: 'سطيف',
    rating: 4.8,
    review_count: 142,
    price_range: '100000 - 500000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'شركة تنظيم حفلات متكاملة. من التخطيط إلى التنفيذ نقدم كل ما تحتاجه لمناسبتك المثالية.',
    description_en: 'Comprehensive event planning company. From planning to execution, we provide everything you need for your perfect event.',
    phone: '0550 678 901',
    whatsapp: '213550678901',
    is_verified: true,
    featured: true,
  },
  {
    id: 8,
    name_ar: 'الشيف مراد للتموين',
    name_en: 'Chef Mourad Catering',
    category: 'طباخين وحلويات',
    category_slug: 'catering',
    city: 'الجزائر العاصمة',
    rating: 4.9,
    review_count: 178,
    price_range: '800 - 2500 د.ج/طبق',
    image_url: '/placeholder.svg',
    description_ar: 'خدمات تموين احترافية للأعراس. قائمة طعام جزائرية تقليدية وعالمية متنوعة مع طهاة محترفين.',
    description_en: 'Professional wedding catering services. Diverse traditional Algerian and international menu with professional chefs.',
    phone: '0662 890 123',
    whatsapp: '213662890123',
    is_verified: true,
    featured: true,
  },
  {
    id: 9,
    name_ar: 'قصر الأفراح تلمسان',
    name_en: 'Palais des Fêtes Tlemcen',
    category: 'قاعات الأفراح',
    category_slug: 'halls',
    city: 'تلمسان',
    rating: 4.7,
    review_count: 156,
    price_range: '100000 - 250000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'قصر أفراح تاريخي بطراز معماري أندلسي. يتسع لـ 300 ضيف مع حديقة خاصة ونافورة مائية.',
    description_en: 'Historic wedding palace with Andalusian architecture. Accommodates 300 guests with a private garden and water fountain.',
    phone: '0543 012 345',
    whatsapp: '213543012345',
    is_verified: true,
    featured: false,
  },
  {
    id: 10,
    name_ar: 'بيل فيساج للمكياج',
    name_en: 'Belle Visage Makeup',
    category: 'مكياج وتجميل',
    category_slug: 'makeup',
    city: 'الجزائر العاصمة',
    rating: 4.8,
    review_count: 115,
    price_range: '20000 - 45000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'صالون مكياج وتجميل متخصص في مكياج العروس. استخدام منتجات ماك وشارلوت تيلبوري الأصلية.',
    description_en: 'Makeup and beauty salon specialized in bridal makeup. Using authentic MAC and Charlotte Tilbury products.',
    phone: '0551 234 567',
    whatsapp: '213551234567',
    is_verified: true,
    featured: false,
  },
  {
    id: 11,
    name_ar: 'دي جي رشيد للصوتيات',
    name_en: 'DJ Rachid Sound',
    category: 'ديجي وموسيقى',
    category_slug: 'dj',
    city: 'عنابة',
    rating: 4.5,
    review_count: 47,
    price_range: '20000 - 60000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'دي جي مع 10 سنوات خبرة في الأعراس. معدات صوتية احترافية وطبلة جزائرية تقليدية.',
    description_en: 'DJ with 10 years of wedding experience. Professional sound equipment and traditional Algerian drums.',
    phone: '0772 345 678',
    whatsapp: '213772345678',
    is_verified: false,
    featured: false,
  },
  {
    id: 12,
    name_ar: 'فيجن فيديو للتصوير',
    name_en: 'Vision Video Production',
    category: 'تصوير فيديو',
    category_slug: 'videography',
    city: 'البليدة',
    rating: 4.6,
    review_count: 73,
    price_range: '30000 - 90000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'شركة إنتاج فيديو متخصصة في تغطية الأعراس. تصوير سينمائي عالي الجودة مع مونتاج احترافي.',
    description_en: 'Video production company specialized in wedding coverage. High-quality cinematic filming with professional editing.',
    phone: '0663 456 789',
    whatsapp: '213663456789',
    is_verified: true,
    featured: false,
  },
  {
    id: 13,
    name_ar: 'أجواء للديكور والزينة',
    name_en: 'Ajwaa Decoration Studio',
    category: 'ديكور وزينة',
    category_slug: 'decoration',
    city: 'سطيف',
    rating: 4.4,
    review_count: 38,
    price_range: '15000 - 60000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'استوديو ديكور يقدم حلولاً إبداعية لتزيين قاعات الأفراح والمناسبات بأسعار تنافسية.',
    description_en: 'Decoration studio offering creative solutions for wedding hall and event decoration at competitive prices.',
    phone: '0554 567 890',
    whatsapp: '213554567890',
    is_verified: false,
    featured: false,
  },
  {
    id: 14,
    name_ar: 'عدسة قسنطينة للتصوير',
    name_en: 'Adasa Constantine Photography',
    category: 'تصوير مناسبات',
    category_slug: 'photography',
    city: 'قسنطينة',
    rating: 4.7,
    review_count: 91,
    price_range: '18000 - 45000 د.ج',
    image_url: '/placeholder.svg',
    description_ar: 'استوديو تصوير فني في قسنطينة. تصوير بورتريه ومناسبات مع أسلوب فني مميز وألبومات فاخرة.',
    description_en: 'Artistic photography studio in Constantine. Portrait and event photography with a distinctive artistic style and luxury albums.',
    phone: '0665 678 901',
    whatsapp: '213665678901',
    is_verified: true,
    featured: true,
  },
];

// =============================================================================
// In-Memory Data Stores (persist during server lifetime)
// =============================================================================

let cartItems: any[] = [];
const bookings: any[] = [];
let wishlistIds: number[] = [];
let waitlistItems: any[] = [];
const disputes: any[] = [];
const notifications: any[] = [
  {
    id: 1,
    type: 'trust',
    title: 'ارتقاء الهوية السيادية',
    message: 'تم تحديث رصيد ثقتك إلى الرقم +85 بناءً على الالتزام بالعقود.',
    is_read: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 2,
    type: 'financial',
    title: 'تحرير ضمان ائتماني',
    message: 'تم الإفراج عن مبلغ 12,000 DA من خزانة الضمان (Escrow).',
    is_read: false,
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 3,
    type: 'asset',
    title: 'مراقبة جودة الأصل',
    message: 'أصلك "فستان قسنطيني" مر بمرحلة فحص النظافة بنجاح.',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4,
    type: 'system',
    title: 'تحديث ميثاق STANDARD',
    message: 'تم تحديث بروتوكول التحكيم التلقائي V.2.1.',
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];
const contracts: any[] = [];
const returnRequests: any[] = [];

// =============================================================================
// Helpers
// =============================================================================

const mockInsurancePlans = [
  {
    id: 1,
    name_ar: 'خطة أساسية',
    name_en: 'Basic Plan',
    price: 500,
    coverage_ar: 'تغطية التلفيات البسيطة',
    coverage_en: 'Covers minor damages',
  },
  {
    id: 2,
    name_ar: 'خطة متقدمة',
    name_en: 'Premium Plan',
    price: 1200,
    coverage_ar: 'تغطية شاملة تشمل التلفيات والفقدان',
    coverage_en: 'Comprehensive coverage including damage and loss',
  },
  {
    id: 3,
    name_ar: 'خطة VIP',
    name_en: 'VIP Plan',
    price: 2500,
    coverage_ar: 'تغطية كاملة مع استبدال فوري',
    coverage_en: 'Full coverage with instant replacement',
  },
];

/** Wrap response in sovereign envelope */
function wrap(data: unknown, meta?: Record<string, unknown>) {
  const response: Record<string, unknown> = {
    success: true,
    dignity_preserved: true,
    data,
  };
  if (meta) response.meta = meta;
  return response;
}

/** Normalise path: strip leading/trailing slashes, collapse doubles */
function normPath(raw: string): string {
  return raw.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

/** Extract query params from full URL */
function getQueryParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url, 'http://localhost');
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return params;
}

/** Generate a numeric ID for new items */
let _idCounter = 1000;
function nextId(): number {
  return ++_idCounter;
}

/** Mock user object (CRITICAL — dashboard pages depend on this) */
const mockUser = {
  id: 1,
  username: 'مستخدم_سيادي',
  email: 'user@standard.dz',
  trust_score: 72,
  is_verified: true,
  first_name: 'مستخدم',
  last_name: 'سيادي',
  phone: '0770 123 456',
  role: 'customer',
  is_2fa_enabled: false,
  wallet_balance: 45250,
};

// =============================================================================
// GET Handler
// =============================================================================

function resolveGet(joined: string, queryParams: Record<string, string>): unknown {
  const p = normPath(joined);

  // ---- Health ----
  if (p === 'health' || p === 'health/') {
    return { status: 'sovereign_proceeding', code: 'SYSTEM_NOMINAL' };
  }

  // ---- Auth ----
  if (p === 'auth/me' || p === 'auth/me/' || p === 'auth/profile' || p === 'auth/profile/') {
    return { user: mockUser };
  }
  if (p.startsWith('auth/')) {
    return { user: null };
  }

  // ---- Vendors ----
  if (p === 'vendors' || p === 'vendors/vendors' || p === 'vendors/' || p === 'vendors/vendors/') {
    return vendors;
  }
  const vendorByIdMatch = p.match(/^vendors\/vendors\/(\d+)$/);
  if (vendorByIdMatch) {
    const id = parseInt(vendorByIdMatch[1], 10);
    return vendors.find((v: any) => v.id === id) || null;
  }

  // Vendor dashboard
  if (p === 'vendors/dashboard' || p === 'vendors/dashboard/') {
    return {
      vendor: {
        id: 1,
        business_name_ar: 'دار القصر للأزياء',
        status: 'active',
        commission_rate: 5,
      },
      total_products: 45,
      total_bookings: 128,
      active_bookings: 12,
      total_revenue: 285000,
      total_commission: 14250,
      pending_commission: 3200,
      recent_bookings: [
        { id: 'BK-301', product_name: 'فستان سهرة ذهبي', sale_amount: 8500, commission_amount: 425, status: 'active', calculated_at: '2026-01-15T10:30:00Z' },
        { id: 'BK-298', product_name: 'بدلة رجالية سوداء', sale_amount: 5000, commission_amount: 250, status: 'completed', calculated_at: '2026-01-12T14:20:00Z' },
        { id: 'BK-295', product_name: 'قفطان تقليدي', sale_amount: 12000, commission_amount: 600, status: 'active', calculated_at: '2026-01-10T09:15:00Z' },
      ],
    };
  }

  // Vendor products
  const vendorProductsMatch = p.match(/^vendors\/(\d+)\/products$/);
  if (vendorProductsMatch) {
    const vendorId = parseInt(vendorProductsMatch[1], 10);
    return products.filter((pr: any) => pr.owner_id === vendorId);
  }

  // ---- Artisans ----
  if (p === 'artisans/artisans' || p === 'artisans/artisans/') {
    return artisans;
  }

  // ---- Bundles ----
  if (p === 'bundles/bundles' || p === 'bundles/bundles/' || p === 'bundles' || p === 'bundles/') {
    return bundles;
  }

  // ---- Products ----
  // Product search-suggestions
  if (p === 'products/search-suggestions' || p === 'products/search-suggestions/') {
    const q = (queryParams.q || '').trim();
    if (!q) return [];
    const suggestions = products
      .filter((pr: any) => pr.name_ar.includes(q))
      .slice(0, 5)
      .map((pr: any) => pr.name_ar);
    return suggestions;
  }

  // Product categories
  if (p === 'products/categories' || p === 'products/categories/') {
    return [
      { id: 1, name_ar: 'فساتين زفاف', slug: 'wedding-dresses' },
      { id: 2, name_ar: 'بدلات رجالية', slug: 'mens-suits' },
      { id: 3, name_ar: 'قفطان جزائري', slug: 'caftan-algerian' },
      { id: 4, name_ar: 'قرطاسيات', slug: 'karstassiya' },
      { id: 5, name_ar: 'جلابيات فاخرة', slug: 'galabiya-luxury' },
      { id: 6, name_ar: 'أزياء مناسبات', slug: 'occasion-wear' },
    ];
  }

  // Product metadata
  if (p === 'products/metadata' || p === 'products/metadata/') {
    return { total: products.length, categories: [] };
  }

  // Product recommendations
  const recMatch = p.match(/^products\/(\d+)\/recommendations$/);
  if (recMatch) {
    const id = parseInt(recMatch[1], 10);
    const others = products.filter((pr: any) => pr.id !== id);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 4);
    return { recommendations: shuffled };
  }

  // Product matching-accessories
  const accessoryMatch = p.match(/^products\/(\d+)\/matching-accessories$/);
  if (accessoryMatch) {
    return products.slice(0, 3);
  }

  // Product wishlist
  if (p === 'products/wishlist' || p === 'products/wishlist/') {
    return products.filter((pr: any) => wishlistIds.includes(pr.id));
  }

  // Wishlist check
  const wishlistCheckMatch = p.match(/^products\/wishlist\/check\/(\d+)$/);
  if (wishlistCheckMatch) {
    const id = parseInt(wishlistCheckMatch[1], 10);
    return { is_in_wishlist: wishlistIds.includes(id) };
  }

  // Product wishlist toggle / delete (GET shouldn't happen but just in case)
  // Product detail by ID
  const productMatch = p.match(/^products\/(\d+)$/);
  if (productMatch) {
    const id = parseInt(productMatch[1], 10);
    const product = products.find((pr: any) => pr.id === id);
    if (product) {
      return { ...product, owner_id: product.owner_id || Math.ceil(product.id / 4) };
    }
    return null;
  }

  // Products list (general) — with optional search & filters
  if (p === 'products' || p === 'products/') {
    let result = [...products];
    const search = (queryParams.search || '').trim();
    if (search) {
      result = result.filter((pr: any) => pr.name_ar.includes(search));
    }
    if (queryParams.vendor_id) {
      const vid = parseInt(queryParams.vendor_id, 10);
      result = result.filter((pr: any) => pr.owner_id === vid);
    }
    if (queryParams.category) {
      result = result.filter((pr: any) => pr.category?.slug === queryParams.category);
    }
    if (queryParams.min_price) {
      const min = parseInt(queryParams.min_price, 10);
      result = result.filter((pr: any) => pr.price_per_day >= min);
    }
    if (queryParams.max_price) {
      const max = parseInt(queryParams.max_price, 10);
      result = result.filter((pr: any) => pr.price_per_day <= max);
    }
    if (queryParams.location) {
      result = result.filter((pr: any) => pr.location_name === queryParams.location);
    }
    if (queryParams.ordering === 'price_asc') {
      result.sort((a: any, b: any) => a.price_per_day - b.price_per_day);
    } else if (queryParams.ordering === 'price_desc') {
      result.sort((a: any, b: any) => b.price_per_day - a.price_per_day);
    }
    return result;
  }

  // Products with query params (vendor_id filter)
  if (p.startsWith('products') && p.includes('vendor_id')) {
    const vendorIdMatch = p.match(/vendor_id=(\d+)/);
    if (vendorIdMatch) {
      const vid = parseInt(vendorIdMatch[1], 10);
      return products.filter((pr: any) => pr.owner_id === vid || pr.id <= vid * 3);
    }
    return products;
  }

  // ---- Bookings ----
  // Cart
  if (p === 'bookings/cart' || p === 'bookings/cart/') {
    return {
      items: cartItems,
      total: cartItems.reduce((s: number, i: any) => s + (i.price_per_day || i.price || 0), 0),
    };
  }

  // Waitlist
  if (p === 'bookings/waitlist' || p === 'bookings/waitlist/') {
    return waitlistItems;
  }

  // Calculate deposit
  if (p === 'bookings/calculate-deposit' || p === 'bookings/calculate-deposit/') {
    return { deposit_amount: 5000 };
  }

  // Refunds
  if (p === 'bookings/refunds' || p === 'bookings/refunds/') {
    return [];
  }

  // Booking detail
  const bookingDetailMatch = p.match(/^bookings\/(BK-\d+|\d+)$/);
  if (bookingDetailMatch) {
    const bkId = bookingDetailMatch[1];
    return bookings.find((b: any) => b.id === bkId) || null;
  }

  // Booking cancellation policy
  const cancelPolicyMatch = p.match(/^bookings\/(\d+)\/cancellation-policy$/);
  if (cancelPolicyMatch) {
    return {
      free_cancellation_hours: 24,
      penalty_percentage: 25,
      description_ar: 'يمكنك الإلغاء مجاناً خلال 24 ساعة من الحجز. بعد ذلك يتم خصم 25% من المبلغ.',
    };
  }

  // Bookings list
  if (p === 'bookings' || p === 'bookings/' || p.startsWith('bookings/admin') || p.startsWith('bookings/admin/')) {
    if (p.includes('stats')) {
      return { total: bookings.length, active: bookings.filter((b: any) => b.status === 'active' || b.status === 'confirmed').length };
    }
    return bookings;
  }

  // ---- Reviews ----
  if (p === 'reviews/reviews' || p.startsWith('reviews/reviews?') || p === 'reviews/reviews/' || p === 'reviews' || p === 'reviews/') {
    return reviews;
  }

  // ---- Notifications ----
  if (p === 'notifications' || p === 'notifications/') {
    return notifications;
  }

  // ---- Analytics ----
  if (p === 'analytics/user-behavior' || p === 'analytics/user-behavior/') {
    return {
      browsing_history: [
        { product_id: 1, viewed_at: new Date(Date.now() - 3600000).toISOString() },
        { product_id: 3, viewed_at: new Date(Date.now() - 7200000).toISOString() },
        { product_id: 7, viewed_at: new Date(Date.now() - 86400000).toISOString() },
      ],
      preferred_categories: ['قفطان جزائري', 'بدلات رجالية'],
      rental_frequency: 'biweekly',
      avg_rental_duration: 3.5,
    };
  }

  if (p === 'analytics/daily' || p === 'analytics/daily/') {
    const days = parseInt(queryParams.days || '7', 10);
    const data = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 50000 + 20000),
      bookings: Math.floor(Math.random() * 15 + 5),
      new_users: Math.floor(Math.random() * 10 + 2),
    }));
    return data;
  }

  if (p === 'analytics/daily/summary' || p === 'analytics/daily/summary/') {
    return {
      total_revenue_7d: 245000,
      total_bookings_7d: 67,
      avg_daily_revenue: 35000,
      growth_rate: 12.5,
      peak_day: 'الجمعة',
      forecast_revenue_next_7d: 280000,
    };
  }

  if (p === 'analytics/admin/dashboard' || p === 'analytics/admin/dashboard/') {
    return {
      total_revenue: 1250000,
      total_bookings: 342,
      total_users: 1250,
      active_listings: 189,
      avg_rating: 4.7,
    };
  }

  if (p === 'analytics/admin/revenue' || p === 'analytics/admin/revenue/') {
    return {
      revenue: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 80000 + 30000),
      })),
    };
  }

  if (p === 'analytics/admin/sales-report' || p === 'analytics/admin/sales-report/') {
    return { report: 'تقرير المبيعات الشهري - يناير 2026', generated_at: new Date().toISOString() };
  }

  if (p === 'analytics/products/top_products' || p === 'analytics/products/top_products/') {
    return products.slice(0, 5).map((pr: any) => ({
      product_id: pr.id,
      name_ar: pr.name_ar,
      total_rentals: Math.floor(Math.random() * 50 + 10),
      revenue: Math.floor(Math.random() * 200000 + 50000),
      avg_rating: pr.rating || 4.5,
    }));
  }

  if (p === 'analytics/products' || p === 'analytics/products/') {
    return products.slice(0, 5).map((pr: any) => ({
      product_id: pr.id,
      name_ar: pr.name_ar,
      views: Math.floor(Math.random() * 500 + 50),
      conversions: Math.floor(Math.random() * 30 + 5),
    }));
  }

  if (p === 'analytics/admin/regional-liquidity' || p === 'analytics/admin/regional-liquidity/') {
    return {
      regions: [
        { name: 'الجزائر العاصمة', liquidity: 450000, active_rentals: 45 },
        { name: 'وهران', liquidity: 280000, active_rentals: 28 },
        { name: 'قسنطينة', liquidity: 195000, active_rentals: 19 },
        { name: 'تلمسان', liquidity: 150000, active_rentals: 15 },
        { name: 'سطيف', liquidity: 120000, active_rentals: 12 },
      ],
    };
  }

  if (p === 'analytics/intelligence/report' || p === 'analytics/intelligence/report/') {
    return {
      title: 'تقرير الذكاء السوقي',
      summary: 'السوق الجزائري للكراء يظهر نمواً بنسبة 12% شهرياً',
      generated_at: new Date().toISOString(),
    };
  }

  if (p === 'analytics/intelligence/pulse' || p === 'analytics/intelligence/pulse/') {
    return {
      pulse_score: 78,
      trend: 'up',
      signals: ['زيادة الطلب على القفطان', 'تراجع العروض المتاحة في وهران'],
    };
  }

  if (p.startsWith('analytics/events')) {
    return [];
  }
  if (p.startsWith('analytics/live/')) {
    return { viewers: Math.floor(Math.random() * 20 + 5), active_sessions: Math.floor(Math.random() * 10 + 2) };
  }
  if (p.startsWith('analytics/visuals/')) {
    return { type: 'infographic', data: {} };
  }
  if (p.startsWith('analytics')) {
    return { revenue: 0, bookings: 0, users: 0 };
  }

  // ---- Payments ----
  if (p === 'payments/methods' || p === 'payments/methods/') {
    return [
      { id: '1', type: 'baridimob', name: 'البريدي موب', display_name: 'البريدي موب', icon: '📱' },
      { id: '2', type: 'card', name: 'بطاقة بنكية', display_name: 'بطاقة بنكية', icon: '💳' },
    ];
  }

  if (p === 'payments/metrics' || p === 'payments/metrics/') {
    return { total_escrow: 285000, active_escrows: 12, released_this_month: 145000 };
  }

  if (p.startsWith('payments/payments/')) {
    return { status: 'completed' };
  }

  if (p.startsWith('payments/create')) {
    return { payment_id: `PAY-${Date.now()}`, status: 'pending' };
  }

  // ---- Social ----
  if (p === 'social/feed' || p === 'social/feed/') {
    return [
      {
        id: 1,
        type: 'vouch',
        user: { username: 'أمين_الجزائر', profile_image: 'https://picsum.photos/seed/user1/100/100', is_sovereign: true, trust_score: 89 },
        target_name: 'فستان زفاف أميرة الزهراء',
        target_image: 'https://picsum.photos/seed/product1a/100/100',
        content: 'تجربة كراء ممتازة! الفستان كان في حالة مثالية.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        type: 'review',
        user: { username: 'سارة_قسنطينة', profile_image: 'https://picsum.photos/seed/user2/100/100', is_sovereign: false, trust_score: 65 },
        target_name: 'قفطان جزائري ملكي ذهبي',
        target_image: 'https://picsum.photos/seed/product3a/100/100',
        content: 'تطريز ذهبي رائع. أنصح الجميع بتجربته.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }

  if (p === 'social/pulse' || p === 'social/pulse/') {
    return { trending: 'قفطان جزائري', mentions: 142, sentiment: 'positive' };
  }

  const socialScoreMatch = p.match(/^social\/score\/(\d+)$/);
  if (socialScoreMatch) {
    return { user_id: parseInt(socialScoreMatch[1], 10), social_score: 72, vouches: 15 };
  }

  // ---- Wallet ----
  if (p === 'wallet' || p === 'wallet/') {
    return {
      balance: 45250,
      escrow_total: 12800,
      transactions: [
        { id: 'TX-9021', type: 'ESCROW_HELD', amount: 1250, date: new Date().toISOString(), note: 'حجز فستان سهرة - مرجع #2041', hash: '0x8f2d...23e1' },
        { id: 'TX-8942', type: 'INCOME', amount: 8500, date: new Date(Date.now() - 86400000).toISOString(), note: 'تسوية حجز معدات تصوير', hash: '0x4e5f...6g7h' },
        { id: 'TX-8811', type: 'EXPENDITURE', amount: 2100, date: new Date(Date.now() - 172800000).toISOString(), note: 'رسوم فحص تقني - كاميرا سوني', hash: '0x9i0j...k1l2' },
      ],
    };
  }

  // ---- Subscriptions ----
  if (p === 'subscriptions' || p === 'subscriptions/') {
    return {
      active_plan: { id: 'free', name_ar: 'مجاني', price: 0 },
      plans: [
        { id: 'free', name_ar: 'مجاني', price: 0, bookings_limit: 3, features: ['تصفح المنتجات', '3 حجوزات شهرياً', 'دعم بالبريد'] },
        { id: 'basic', name_ar: 'أساسي', price: 1500, bookings_limit: 10, features: ['10 حجوزات شهرياً', 'تأمين أساسي مجاني', 'دعم هاتفي', 'شارة عضو أساسي'] },
        { id: 'premium', name_ar: 'مميز', price: 4500, bookings_limit: -1, features: ['حجوزات غير محدودة', 'تأمين متقدم مجاني', 'أولوية في العروض', 'خصم 10%', 'شارة عضو مميز', 'مستشار شخصي'] },
        { id: 'vip', name_ar: 'VIP', price: 9900, bookings_limit: -1, features: ['كل مميزات مميز', 'توصيل مجاني', 'دخول مبكر للعروض', 'نقاط ثقة مضاعفة', 'شارة VIP ذهبية', 'دعم على مدار الساعة'] },
      ],
      history: [
        { id: 'SUB-001', plan: 'أساسي', amount: 1500, status: 'مدفوع', date: '2025-12-01' },
        { id: 'SUB-002', plan: 'مميز', amount: 4500, status: 'نشط', date: '2026-01-01' },
        { id: 'SUB-003', plan: 'أساسي', amount: 1500, status: 'ملغي', date: '2025-11-01' },
      ],
    };
  }

  // ---- Disputes ----
  if (p === 'disputes/disputes' || p === 'disputes/disputes/') {
    return disputes;
  }

  const disputeDetailMatch = p.match(/^disputes\/disputes\/(\d+)$/);
  if (disputeDetailMatch) {
    const id = parseInt(disputeDetailMatch[1], 10);
    return disputes.find((d: any) => d.id === id) || null;
  }

  // Dispute sub-endpoints
  const disputeSubMatch = p.match(/^disputes\/disputes\/(\d+)\/(messages|history|status|verdict|evidence|judgment|audit-trail|mediation\/offers)$/);
  if (disputeSubMatch) {
    const sub = disputeSubMatch[2];
    if (sub === 'messages') return [];
    if (sub === 'history') return [
      { label_ar: 'تقديم الشكوى', status: 'completed', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
      { label_ar: 'مراجعة الأدلة', status: 'completed', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
      { label_ar: 'الوساطة', status: 'active', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { label_ar: 'القرار النهائي', status: 'pending' },
    ];
    if (sub === 'status') return { status: 'under_review', phase: 'mediation' };
    if (sub === 'verdict') return { verdict: 'pending', ruling_text: 'لم يصدر قرار بعد' };
    if (sub === 'evidence') return [];
    if (sub === 'judgment') return { verdict: 'pending', is_final: false };
    if (sub === 'audit-trail') return [];
    if (sub === 'mediation/offers') return [];
  }

  // Dispute public ledger / judicial stats
  if (p === 'disputes/public-ledger' || p === 'disputes/public-ledger/' || p === 'v1/public/judgments' || p === 'v1/public/judgments/') {
    return [
      { id: 1, case_reference: 'STD-2026-001', category: 'damage', verdict: 'split', ruling_summary: 'تم تقسيم المسؤولية بين الطرفين', resolution_time_days: 5, filed_at: '2026-01-10' },
      { id: 2, case_reference: 'STD-2026-002', category: 'non_delivery', verdict: 'full_renter', ruling_summary: 'تعويض كامل للمستأجر بسبب عدم التسليم', resolution_time_days: 3, filed_at: '2026-01-12' },
      { id: 3, case_reference: 'STD-2026-003', category: 'quality', verdict: 'full_owner', ruling_summary: 'رفض الدعوى - المنتج مطابق للوصف', resolution_time_days: 7, filed_at: '2026-01-14' },
    ];
  }

  if (p === 'disputes/judicial-stats' || p === 'disputes/judicial-stats/' || p === 'v1/public/metrics' || p === 'v1/public/metrics/') {
    return { total_cases: 45, resolved_cases: 38, avg_resolution_days: 4.2, verdict_distribution: { full_renter: 15, full_owner: 12, split: 8, dismissed: 3 } };
  }

  // Dispute tickets
  if (p === 'disputes/tickets' || p === 'disputes/tickets/') {
    return [];
  }

  // Dispute admin stats
  if (p === 'disputes/admin/disputes/stats' || p === 'disputes/admin/disputes/stats/') {
    return { total: disputes.length, open: disputes.filter((d: any) => d.status !== 'closed').length };
  }
  if (p === 'disputes/admin/tickets/stats' || p === 'disputes/admin/tickets/stats/') {
    return { total: 0, open: 0 };
  }
  if (p === 'disputes/admin/vault/integrity' || p === 'disputes/admin/vault/integrity/') {
    return { integrity_verified: true, last_check: new Date().toISOString() };
  }

  // Dispute appeals
  if (p === 'disputes/appeals' || p === 'disputes/appeals/') {
    return [];
  }
  const appealDetailMatch = p.match(/^disputes\/appeals\/(\d+)$/);
  if (appealDetailMatch) {
    return { id: parseInt(appealDetailMatch[1], 10), status: 'pending' };
  }
  const judgmentDetailMatch = p.match(/^disputes\/judgments\/(\d+)$/);
  if (judgmentDetailMatch) {
    return { id: parseInt(judgmentDetailMatch[1], 10), verdict: 'pending', is_final: false };
  }
  const mediationOfferMatch = p.match(/^disputes\/mediation\/offers\/(\d+)\/accept$/);
  if (mediationOfferMatch) {
    return { accepted: true };
  }

  if (p.startsWith('disputes')) {
    return [];
  }

  // ---- Contracts ----
  const contractDigitalMatch = p.match(/^contracts\/digital\/(\d+)$/);
  if (contractDigitalMatch) {
    const id = parseInt(contractDigitalMatch[1], 10);
    const existing = contracts.find((c: any) => c.id === id);
    if (existing) return existing;
    // Return mock contract if not found
    return {
      id: id,
      booking_id: id,
      status: 'draft',
      is_finalized: false,
      contract_hash: `0x${Buffer.from(`contract-${id}`).toString('hex')}`,
      created_at: new Date().toISOString(),
      snapshot: { terms: 'شروط الكراء القياسية' },
      parties: [
        { id: '1', name: 'مستخدم سيادي', role: 'renter', signed: false },
        { id: '2', name: 'دار القصر للأزياء', role: 'owner', signed: false },
      ],
      terms: 'شروط وأحكام عقد الكراء المعتمد من ستاندرد. يتم تطبيق أحكام القانون التجاري الجزائري.',
    };
  }

  if (p === 'contracts/digital' || p === 'contracts/digital/') {
    const bookingParam = queryParams.booking;
    if (bookingParam) {
      const found = contracts.find((c: any) => c.booking_id === parseInt(bookingParam, 10));
      return found || null;
    }
    return contracts;
  }

  // Legacy contract endpoint (contracts/1)
  const contractLegacyMatch = p.match(/^contracts\/(\d+)$/);
  if (contractLegacyMatch) {
    const id = parseInt(contractLegacyMatch[1], 10);
    const existing = contracts.find((c: any) => c.id === id);
    if (existing) return existing;
    return {
      id: id,
      booking_id: id,
      status: 'draft',
      is_finalized: false,
      contract_hash: `0x${Buffer.from(`contract-${id}`).toString('hex')}`,
      created_at: new Date().toISOString(),
      snapshot: { terms: 'شروط الكراء القياسية' },
      parties: [
        { id: '1', name: 'مستخدم سيادي', role: 'renter', signed: false },
        { id: '2', name: 'دار القصر للأزياء', role: 'owner', signed: false },
      ],
      terms: 'شروط وأحكام عقد الكراء المعتمد من ستاندرد.',
    };
  }

  // ---- Returns ----
  if (p.startsWith('returns/returns/my_returns') || p.startsWith('returns/my_returns') || p.startsWith('returns/returns') || p.startsWith('returns') || p === 'returns' || p === 'returns/') {
    return returnRequests;
  }

  // ---- Warranties / Insurance ----
  if (p.startsWith('warranties/insurance')) {
    return { recommended_plan: null, plans: mockInsurancePlans };
  }

  // ---- Locations ----
  if (p === 'locations/addresses' || p === 'locations/addresses/') {
    return [
      { id: 1, address: 'شارع ديدوش مراد، الجزائر العاصمة', city: 'الجزائر العاصمة', is_default: true, delivery_zone: 1 },
      { id: 2, address: 'شارع لاربي بن مهيدي، وهران', city: 'وهران', is_default: false, delivery_zone: 2 },
    ];
  }
  if (p.startsWith('locations/delivery-zones')) {
    return [
      { id: 1, name: 'الجزائر العاصمة', same_day_available: true, delivery_fee: 500 },
      { id: 2, name: 'وهران', same_day_available: false, delivery_fee: 800 },
    ];
  }
  if (p.startsWith('locations/tracking')) {
    return [];
  }
  if (p.startsWith('locations')) {
    return [];
  }

  // ---- Chatbot ----
  if (p.startsWith('chatbot/sessions')) {
    return [];
  }

  // ---- Judicial (v1) ----
  if (p === 'judicial/cases' || p === 'judicial/cases/') {
    return [
      {
        id: 1,
        case_number: 'JD-2026-001',
        title_ar: 'نزاع تلف فستان زفاف',
        status: 'under_review',
        filed_at: '2026-01-10',
        category: 'damage',
      },
      {
        id: 2,
        case_number: 'JD-2026-002',
        title_ar: 'عدم تسليم بدلة في الموعد',
        status: 'closed',
        filed_at: '2026-01-05',
        category: 'non_delivery',
      },
      {
        id: 3,
        case_number: 'JD-2026-003',
        title_ar: 'مطابقة المنتج للوصف',
        status: 'judgment_provisional',
        filed_at: '2026-01-08',
        category: 'quality',
      },
    ];
  }

  // v1 judicial endpoints
  const v1DisputeMatch = p.match(/^v1\/judicial\/disputes\/(\d+)\/(status|close)$/);
  if (v1DisputeMatch) {
    const id = v1DisputeMatch[1];
    return { dispute_id: id, status: 'under_review' };
  }
  const v1CaseMatch = p.match(/^v1\/tribunal\/cases\/(\d+)$/);
  if (v1CaseMatch) {
    return { id: parseInt(v1CaseMatch[1], 10), case_number: `TC-${v1CaseMatch[1]}`, status: 'open' };
  }
  if (p.startsWith('v1/')) {
    return [];
  }

  // ---- Maintenance / Hygiene / Packaging / Inventory ----
  if (p.startsWith('maintenance/') || p.startsWith('hygiene/') || p.startsWith('packaging/') || p.startsWith('inventory/')) {
    return [];
  }

  // ---- Admin ----
  if (p.startsWith('auth/admin/')) {
    return [];
  }
  if (p.startsWith('products/admin/')) {
    return [];
  }
  // ---- Local Guide ----
  if (p === 'local-guide/categories' || p === 'local-guide/categories/') {
    return localGuideCategories;
  }
  if (p === 'local-guide/services' || p === 'local-guide/services/') {
    let filtered = [...localGuideServices];
    const cityFilter = queryParams.city;
    const categoryFilter = queryParams.category;
    if (cityFilter) {
      filtered = filtered.filter((s: any) => s.city === cityFilter);
    }
    if (categoryFilter) {
      filtered = filtered.filter((s: any) => s.category_slug === categoryFilter);
    }
    return filtered;
  }
  const localGuideServiceByIdMatch = p.match(/^local-guide\/services\/(\d+)$/);
  if (localGuideServiceByIdMatch) {
    const id = parseInt(localGuideServiceByIdMatch[1], 10);
    return localGuideServices.find((s: any) => s.id === id) || null;
  }

  // Fallback
  return {};
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const joined = (path || []).join('/');
  const queryParams = getQueryParams(request);

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!rateLimit(clientIp)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  const data = resolveGet(joined, queryParams);
  return NextResponse.json(wrap(data));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const p = normPath((path || []).join('/'));

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!rateLimit(clientIp)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  let body: any = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
    body = sanitizeBody(body);
  } catch {
    // If body is not JSON (e.g., FormData), just use empty object
  }

  // ---- Auth: Login ----
  if (p === 'auth/login' || p === 'auth/login/') {
    if (!rateLimit(`auth:${clientIp}`, AUTH_RATE_LIMIT_MAX)) {
      return NextResponse.json({ success: false, error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }
    return NextResponse.json(wrap({
      user: mockUser,
      token: randomUUID(),
    }));
  }

  // ---- Auth: Register ----
  if (p === 'auth/register' || p === 'auth/register/') {
    if (!rateLimit(`auth:${clientIp}`, AUTH_RATE_LIMIT_MAX)) {
      return NextResponse.json({ success: false, error: 'Too many registration attempts. Try again later.' }, { status: 429 });
    }
    return NextResponse.json(wrap({
      user: { ...mockUser, id: nextId(), email: body.email || 'new@standard.dz' },
      token: randomUUID(),
    }));
  }

  // ---- Auth: Logout ----
  if (p === 'auth/logout' || p === 'auth/logout/') {
    return NextResponse.json(wrap({ message: 'تم تسجيل الخروج' }));
  }

  // ---- Auth: Password Reset ----
  if (p.startsWith('auth/password/reset')) {
    return NextResponse.json(wrap({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور' }));
  }

  // ---- Auth: 2FA ----
  if (p.startsWith('auth/security/2fa')) {
    return NextResponse.json(wrap({ secret: 'JBSWY3DPEHPK3PXP', qr_code: 'data:image/png;base64,mock' }));
  }

  // ---- Bookings: Cart (add item) ----
  if (p === 'bookings/cart/items' || p === 'bookings/cart/items/') {
    const product = products.find((pr: any) => pr.id === body.product_id);
    if (!product) {
      return NextResponse.json(wrap(null), { status: 404 });
    }
    const cartItem = {
      id: nextId(),
      product_id: body.product_id,
      product_name: product.name_ar,
      product_image: product.primary_image || product.images?.[0]?.url,
      price_per_day: product.price_per_day,
      start_date: body.start_date,
      end_date: body.end_date,
      quantity: body.quantity || 1,
      size: body.size || product.size_options?.[0],
      color: body.color || product.color_options?.[0],
      added_at: new Date().toISOString(),
    };
    cartItems.push(cartItem);
    return NextResponse.json(wrap(cartItem));
  }

  // ---- Bookings: Create (from cart or directly) ----
  if (p === 'bookings/create' || p === 'bookings/create/') {
    const bookingId = `BK-${Date.now()}`;
    let total_price = 0;
    let product_name = 'منتج';

    if (cartItems.length > 0) {
      // Create from cart
      total_price = cartItems.reduce((s: number, i: any) => s + (i.price_per_day || 0) * (i.quantity || 1), 0);
      product_name = cartItems[0].product_name || 'منتج';
      const newBooking = {
        id: bookingId,
        product_id: cartItems[0].product_id,
        product_name,
        start_date: cartItems[0].start_date,
        end_date: cartItems[0].end_date,
        total_price,
        status: 'pending',
        escrow_status: 'held',
        items: [...cartItems],
        created_at: new Date().toISOString(),
      };
      bookings.push(newBooking);
      cartItems = [];
      return NextResponse.json(wrap(newBooking));
    } else if (body.product_id) {
      // Create directly
      const product = products.find((pr: any) => pr.id === body.product_id);
      if (product) {
        product_name = product.name_ar;
        const days = body.end_date && body.start_date
          ? Math.max(1, Math.ceil((new Date(body.end_date).getTime() - new Date(body.start_date).getTime()) / 86400000))
          : 1;
        total_price = product.price_per_day * days;
      }
      const newBooking = {
        id: bookingId,
        product_id: body.product_id,
        product_name,
        start_date: body.start_date,
        end_date: body.end_date,
        total_price,
        status: 'pending',
        escrow_status: 'held',
        has_insurance: body.has_insurance || false,
        extra_services: body.extra_services || [],
        created_at: new Date().toISOString(),
      };
      bookings.push(newBooking);
      return NextResponse.json(wrap(newBooking));
    }

    return NextResponse.json(wrap({ id: bookingId, status: 'created' }));
  }

  // ---- Bookings: Waitlist (add) ----
  if (p === 'bookings/waitlist' || p === 'bookings/waitlist/' || p === 'bookings/waitlist/add' || p === 'bookings/waitlist/add/') {
    const product = products.find((pr: any) => pr.id === body.product_id);
    const waitlistItem = {
      id: nextId(),
      product_id: body.product_id,
      product_name: product?.name_ar || 'منتج',
      product_image: product?.primary_image || product?.images?.[0]?.url,
      price_per_day: product?.price_per_day || 0,
      preferred_start: body.preferred_start_date || body.start_date,
      status: 'waiting',
      added_at: new Date().toISOString(),
    };
    waitlistItems.push(waitlistItem);
    return NextResponse.json(wrap(waitlistItem));
  }

  // ---- Bookings: Cancel ----
  const bookingCancelMatch = p.match(/^bookings\/(BK-\d+|\d+)\/cancel$/);
  if (bookingCancelMatch) {
    const bkId = bookingCancelMatch[1];
    const booking = bookings.find((b: any) => b.id === bkId);
    if (booking) booking.status = 'cancelled';
    return NextResponse.json(wrap({ message: 'تم إلغاء الحجز' }));
  }

  // ---- Bookings: Early return ----
  const bookingEarlyReturnMatch = p.match(/^bookings\/(BK-\d+|\d+)\/early-return$/);
  if (bookingEarlyReturnMatch) {
    return NextResponse.json(wrap({ message: 'تم تسجيل طلب الإرجاع المبكر', refund_amount: body.refund_amount || 0 }));
  }

  // ---- Bookings: Agreement ----
  const agreementCreateMatch = p.match(/^bookings\/(BK-\d+|\d+)\/agreement\/create$/);
  if (agreementCreateMatch) {
    const bookingId = agreementCreateMatch[1];
    const contractId = nextId();
    const newContract = {
      id: contractId,
      booking_id: bookingId,
      status: 'draft',
      is_finalized: false,
      contract_hash: `0x${Buffer.from(`contract-${contractId}`).toString('hex')}`,
      created_at: new Date().toISOString(),
      snapshot: { terms: 'شروط الكراء القياسية' },
      parties: [
        { id: '1', name: 'مستخدم سيادي', role: 'renter', signed: false },
        { id: '2', name: 'دار القصر للأزياء', role: 'owner', signed: false },
      ],
      terms: 'شروط وأحكام عقد الكراء المعتمد من ستاندرد.',
    };
    contracts.push(newContract);
    return NextResponse.json(wrap(newContract));
  }

  // ---- Products: Wishlist (add) ----
  if (p === 'products/wishlist' || p === 'products/wishlist/') {
    const productId = body.product_id;
    if (productId && !wishlistIds.includes(productId)) {
      wishlistIds.push(productId);
    }
    return NextResponse.json(wrap({ success: true, wishlist: wishlistIds }));
  }

  // ---- Products: Wishlist toggle ----
  const wishlistToggleMatch = p.match(/^products\/wishlist\/toggle\/(\d+)$/);
  if (wishlistToggleMatch) {
    const id = parseInt(wishlistToggleMatch[1], 10);
    const idx = wishlistIds.indexOf(id);
    if (idx >= 0) {
      wishlistIds.splice(idx, 1);
    } else {
      wishlistIds.push(id);
    }
    return NextResponse.json(wrap({ is_in_wishlist: wishlistIds.includes(id) }));
  }

  // ---- Reviews: Create ----
  if (p === 'reviews/create' || p === 'reviews/create/') {
    const newReview = {
      id: nextId(),
      rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
      comment: sanitizeString(body.comment, 1000),
      booking_id: body.booking_id,
      product_id: body.product_id,
      user_id: body.user_id,
      created_at: new Date().toISOString(),
      status: 'pending',
    };
    return NextResponse.json(wrap(newReview));
  }

  // ---- Disputes: Create ----
  if (p === 'disputes/disputes/create' || p === 'disputes/disputes/create/' || p === 'disputes/disputes' || p === 'disputes/disputes/') {
    const newDispute = {
      id: nextId(),
      booking_id: body.booking_id,
      title: body.description?.substring(0, 50) || 'نزاع جديد',
      description: body.description || '',
      claim_type: body.claim_type || 'general',
      status: 'filed',
      priority: 'medium',
      claimed_amount: body.claimed_amount || 0,
      evidence_urls: body.evidence_urls || [],
      created_at: new Date().toISOString(),
    };
    disputes.push(newDispute);
    return NextResponse.json(wrap(newDispute));
  }

  // ---- Disputes: Messages ----
  const disputeMsgMatch = p.match(/^disputes\/disputes\/(\d+)\/messages$/);
  if (disputeMsgMatch) {
    return NextResponse.json(wrap({ id: nextId(), ...body, created_at: new Date().toISOString() }));
  }

  // ---- Disputes: Evidence upload ----
  const disputeEvidenceUploadMatch = p.match(/^disputes\/disputes\/(\d+)\/evidence\/upload$/);
  if (disputeEvidenceUploadMatch) {
    return NextResponse.json(wrap({ id: nextId(), file_name: 'evidence.jpg', uploaded: true }));
  }

  // ---- Disputes: Tickets ----
  if (p === 'disputes/tickets/create' || p === 'disputes/tickets/create/') {
    const newTicket = {
      id: nextId(),
      ...body,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    return NextResponse.json(wrap(newTicket));
  }

  // ---- Disputes: Ticket messages ----
  const ticketMsgMatch = p.match(/^disputes\/tickets\/(\d+)\/messages$/);
  if (ticketMsgMatch) {
    return NextResponse.json(wrap({ id: nextId(), message: body.message, created_at: new Date().toISOString() }));
  }

  // ---- Disputes: Appeals ----
  const disputeAppealMatch = p.match(/^disputes\/judgments\/(\d+)\/appeal$/);
  if (disputeAppealMatch) {
    return NextResponse.json(wrap({ id: nextId(), judgment_id: parseInt(disputeAppealMatch[1], 10), status: 'pending', reason: body.reason }));
  }

  // ---- Disputes: Appeal evidence ----
  const appealEvidenceMatch = p.match(/^disputes\/appeals\/(\d+)\/submit_evidence$/);
  if (appealEvidenceMatch) {
    return NextResponse.json(wrap({ submitted: true }));
  }

  // ---- Disputes: Mediation accept ----
  const mediationAcceptMatch = p.match(/^disputes\/mediation\/offers\/(\d+)\/accept$/);
  if (mediationAcceptMatch) {
    return NextResponse.json(wrap({ accepted: true }));
  }

  // ---- Contracts: Generate ----
  if (p === 'contracts/generate' || p === 'contracts/generate/') {
    const contractId = nextId();
    const newContract = {
      id: contractId,
      booking_id: body.booking_id,
      status: 'draft',
      is_finalized: false,
      contract_hash: `0x${Buffer.from(`contract-${contractId}`).toString('hex')}`,
      created_at: new Date().toISOString(),
      snapshot: { terms: 'شروط الكراء القياسية' },
      parties: [
        { id: '1', name: 'مستخدم سيادي', role: 'renter', signed: false },
        { id: '2', name: 'دار القصر للأزياء', role: 'owner', signed: false },
      ],
      terms: 'شروط وأحكام عقد الكراء المعتمد من ستاندرد.',
    };
    contracts.push(newContract);
    return NextResponse.json(wrap(newContract));
  }

  // ---- Returns ----
  if (p === 'returns' || p === 'returns/' || p === 'returns/returns' || p === 'returns/returns/') {
    const newReturn = {
      id: `RET-${nextId()}`,
      booking_ref: body.booking_ref || body.booking_id || 'BK-unknown',
      reason: body.reason || 'أخرى',
      description: body.description || '',
      status: 'pending',
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    returnRequests.push(newReturn);
    return NextResponse.json(wrap(newReturn));
  }

  // ---- Payments: Create ----
  if (p === 'payments/create' || p === 'payments/create/') {
    return NextResponse.json(wrap({
      payment_id: `PAY-${Date.now()}`,
      status: 'pending',
      amount: body.amount || 0,
    }));
  }

  // ---- Payments: Verify OTP ----
  const paymentVerifyMatch = p.match(/^payments\/payments\/([^/]+)\/verify_otp$/);
  if (paymentVerifyMatch) {
    return NextResponse.json(wrap({ status: 'verified', message: 'تم التحقق بنجاح' }));
  }

  // ---- Social: Vouch ----
  const socialVouchMatch = p.match(/^social\/vouch\/(\d+)$/);
  if (socialVouchMatch) {
    return NextResponse.json(wrap({ vouched: true, user_id: parseInt(socialVouchMatch[1], 10) }));
  }

  // ---- Chatbot ----
  if (p === 'chatbot/quick-chat' || p === 'chatbot/quick-chat/') {
    return NextResponse.json(wrap({
      response: 'أهلاً! أنا المساعد الذكي لستاندرد. كيف يمكنني مساعدتك؟',
      session_id: `chat-${Date.now()}`,
    }));
  }

  if (p === 'chatbot/sessions/create_anonymous' || p === 'chatbot/sessions/create_anonymous/') {
    return NextResponse.json(wrap({
      id: `session-${Date.now()}`,
      language: body.language || 'ar',
    }));
  }

  const chatSessionMsgMatch = p.match(/^chatbot\/sessions\/([^/]+)\/send_message$/);
  if (chatSessionMsgMatch) {
    return NextResponse.json(wrap({
      id: `msg-${Date.now()}`,
      response: 'شكراً لرسالتك! سأقوم بمساعدتك قريباً.',
      is_bot: true,
    }));
  }

  // ---- Wallet: deposit/withdraw/transfer ----
  if (p.startsWith('wallet/deposit') || p.startsWith('wallet/withdraw') || p.startsWith('wallet/transfer')) {
    return NextResponse.json(wrap({ success: true, message: 'تمت العملية بنجاح', new_balance: 45250 }));
  }

  // ---- Analytics: Events ----
  if (p === 'analytics/events' || p === 'analytics/events/') {
    return NextResponse.json(wrap({ tracked: true }));
  }

  // ---- Locations ----
  if (p === 'locations/addresses' || p === 'locations/addresses/') {
    return NextResponse.json(wrap({ id: nextId(), ...body, is_default: false }));
  }

  if (p === 'locations/delivery-zones' || p === 'locations/delivery-zones/') {
    return NextResponse.json(wrap({ id: nextId(), ...body }));
  }

  if (p === 'locations/deliveries' || p === 'locations/deliveries/') {
    return NextResponse.json(wrap({ id: nextId(), ...body, status: 'pending' }));
  }

  if (p.startsWith('locations/geocode') || p.startsWith('locations/reverse-geocode') || p.startsWith('locations/place-details')) {
    return NextResponse.json(wrap({ coordinates: [36.7538, 3.0588] }));
  }

  // ---- Judicial v1 ----
  if (p === 'v1/judicial/disputes/initiate' || p === 'v1/judicial/disputes/initiate/') {
    const newCase = { id: nextId(), ...body, status: 'filed', filed_at: new Date().toISOString() };
    return NextResponse.json(wrap(newCase));
  }

  const v1VerdictMatch = p.match(/^v1\/judicial\/disputes\/(\d+)\/verdict$/);
  if (v1VerdictMatch) {
    return NextResponse.json(wrap({ dispute_id: v1VerdictMatch[1], ...body, issued_at: new Date().toISOString() }));
  }

  const v1AppealMatch = p.match(/^v1\/judicial\/disputes\/(\d+)\/appeal$/);
  if (v1AppealMatch) {
    return NextResponse.json(wrap({ dispute_id: v1AppealMatch[1], status: 'appealed', reason: body.reason }));
  }

  const v1CloseMatch = p.match(/^v1\/judicial\/disputes\/(\d+)\/close$/);
  if (v1CloseMatch) {
    return NextResponse.json(wrap({ dispute_id: v1CloseMatch[1], status: 'closed' }));
  }

  // ---- Maintenance / Hygiene / Packaging / Inventory / Admin CRUD ----
  if (
    p.startsWith('maintenance/') || p.startsWith('hygiene/') || p.startsWith('packaging/') ||
    p.startsWith('inventory/') || p.startsWith('products/admin/') || p.startsWith('auth/admin/')
  ) {
    if (!isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    return NextResponse.json(wrap({ id: nextId(), ...sanitizeBody(body), created_at: new Date().toISOString() }));
  }

  // ---- Bundles ----
  if (p.startsWith('bundles/')) {
    return NextResponse.json(wrap({ id: nextId(), ...body }));
  }

  // ---- Generic fallback for POST ----
  return NextResponse.json(wrap({
    success: true,
    message_ar: 'تمت العملية بنجاح',
    message_en: 'Operation successful',
  }));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path: _path } = await params;
  void _path;

  let body: any = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore
  }

  // Generic: find in relevant arrays and update
  return NextResponse.json(wrap({
    success: true,
    message_ar: 'تم التحديث بنجاح',
    message_en: 'Updated successfully',
    ...body,
  }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const p = normPath((path || []).join('/'));

  let body: any = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore
  }

  // ---- Bookings: Update ----
  const bookingUpdateMatch = p.match(/^bookings\/(BK-\d+|\d+)\/update$/);
  if (bookingUpdateMatch) {
    const bkId = bookingUpdateMatch[1];
    const booking = bookings.find((b: any) => b.id === bkId);
    if (booking) {
      const allowedFields = ['start_date', 'end_date', 'quantity', 'size', 'color', 'notes'];
      for (const field of allowedFields) {
        if (body[field] !== undefined) booking[field] = body[field];
      }
      return NextResponse.json(wrap(booking));
    }
  }

  // ---- Bookings: Update status ----
  const bookingStatusMatch = p.match(/^bookings\/(BK-\d+|\d+)\/status$/);
  if (bookingStatusMatch) {
    const bkId = bookingStatusMatch[1];
    const booking = bookings.find((b: any) => b.id === bkId);
    if (booking && body.status) {
      booking.status = body.status;
      return NextResponse.json(wrap(booking));
    }
  }

  // ---- Reviews: Moderate ----
  const reviewModerateMatch = p.match(/^reviews\/(\d+)\/moderate$/);
  if (reviewModerateMatch) {
    return NextResponse.json(wrap({ id: parseInt(reviewModerateMatch[1], 10), ...body }));
  }

  // ---- Contracts: Sign ----
  const contractSignMatch = p.match(/^contracts\/digital\/(\d+)\/sign$/);
  if (contractSignMatch) {
    const id = parseInt(contractSignMatch[1], 10);
    let contract = contracts.find((c: any) => c.id === id);
    if (!contract) {
      contract = {
        id,
        booking_id: id,
        status: 'draft',
        is_finalized: false,
        contract_hash: `0x${Buffer.from(`contract-${id}`).toString('hex')}`,
        created_at: new Date().toISOString(),
        parties: [],
        terms: '',
      };
      contracts.push(contract);
    }
    contract.status = 'signed';
    const signatureIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                        request.headers.get('x-real-ip') || 'unknown';
    contract.renter_signature = `signed@${signatureIp}`;
    contract.signed_at = new Date().toISOString();
    if (contract.parties && contract.parties.length > 0) {
      contract.parties[0].signed = true;
      contract.parties[0].signedAt = new Date().toISOString();
      contract.parties[0].ipAddress = signatureIp;
    }
    return NextResponse.json(wrap(contract));
  }

  // ---- Maintenance / Hygiene / Packaging / Inventory / Admin CRUD ----
  if (
    p.startsWith('maintenance/') || p.startsWith('hygiene/') || p.startsWith('packaging/') ||
    p.startsWith('inventory/') || p.startsWith('products/admin/') || p.startsWith('auth/admin/') ||
    p.startsWith('bookings/admin/')
  ) {
    if (!isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    return NextResponse.json(wrap({ id: 1, ...sanitizeBody(body), updated_at: new Date().toISOString() }));
  }

  // ---- Generic fallback ----
  return NextResponse.json(wrap({
    success: true,
    message_ar: 'تم التحديث بنجاح',
    message_en: 'Updated successfully',
  }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const p = normPath((path || []).join('/'));

  // ---- Cart: Delete item ----
  const cartItemDeleteMatch = p.match(/^bookings\/cart\/items\/(\d+)$/);
  if (cartItemDeleteMatch) {
    const itemId = parseInt(cartItemDeleteMatch[1], 10);
    cartItems = cartItems.filter((item: any) => item.id !== itemId);
    return NextResponse.json(wrap({ success: true, message: 'تم حذف المنتج من السلة' }));
  }

  // ---- Cart: Clear all ----
  if (p === 'bookings/cart' || p === 'bookings/cart/' || p === 'bookings/cart/items' || p === 'bookings/cart/items/') {
    cartItems = [];
    return NextResponse.json(wrap({ success: true, message: 'تم تفريغ السلة' }));
  }

  // ---- Wishlist: Delete item ----
  const wishlistDeleteMatch = p.match(/^products\/wishlist\/(\d+)$/);
  if (wishlistDeleteMatch) {
    const id = parseInt(wishlistDeleteMatch[1], 10);
    wishlistIds = wishlistIds.filter((wid) => wid !== id);
    return NextResponse.json(wrap({ success: true, message: 'تم حذف المنتج من المفضلة' }));
  }

  // ---- Waitlist: Delete item ----
  const waitlistDeleteMatch = p.match(/^bookings\/waitlist\/(\d+)$/);
  if (waitlistDeleteMatch) {
    const id = parseInt(waitlistDeleteMatch[1], 10);
    waitlistItems = waitlistItems.filter((item: any) => item.id !== id);
    return NextResponse.json(wrap({ success: true, message: 'تم حذف المنتج من لائحة الانتظار' }));
  }

  // ---- Maintenance / Hygiene / Packaging / Inventory / Admin CRUD ----
  if (
    p.startsWith('maintenance/') || p.startsWith('hygiene/') || p.startsWith('packaging/') ||
    p.startsWith('inventory/') || p.startsWith('products/admin/') || p.startsWith('auth/admin/')
  ) {
    if (!isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    return NextResponse.json(wrap({ success: true, message: 'تم الحذف بنجاح' }));
  }

  // ---- Generic fallback (DELETE) ----
  return NextResponse.json(wrap({ success: true }));
}
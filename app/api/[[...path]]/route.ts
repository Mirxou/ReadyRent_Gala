import { NextRequest, NextResponse } from 'next/server';
import {
  products,
  vendors,
  artisans,
  bundles,
  reviews,
} from '@/lib/mock-data';

// Mock insurance plans for warranties endpoint
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

function resolveGetMock(path: string): unknown {
  // Normalise: strip leading/trailing slashes, collapse double slashes
  const p = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');

  // Vendors list
  if (p === 'vendors' || p === 'vendors/vendors') {
    return vendors;
  }

  // Vendor by ID
  const vendorMatch = p.match(/^vendors\/vendors\/(\d+)$/);
  if (vendorMatch) {
    const id = parseInt(vendorMatch[1], 10);
    return vendors.find((v: any) => v.id === id) || null;
  }

  // Vendor dashboard
  if (p === 'vendors/dashboard' || p === 'vendors/dashboard/') {
    return {
      total_products: 45,
      active_bookings: 12,
      total_revenue: 285000,
      commission: 14250,
      recent_bookings: [
        { id: 'BK-301', product: 'فستان سهرة ذهبي', amount: 8500, status: 'active', date: '2026-01-15' },
        { id: 'BK-298', product: 'بدلة رجالية سوداء', amount: 5000, status: 'completed', date: '2026-01-12' },
        { id: 'BK-295', product: 'قفطان تقليدي', amount: 12000, status: 'active', date: '2026-01-10' },
      ]
    };
  }

  // Vendor products
  if (p.match(/^vendors\/\d+\/products$/)) {
    return products;
  }

  // Artisans
  if (p === 'artisans/artisans') {
    return artisans;
  }

  // Bundles
  if (p === 'bundles/bundles') {
    return bundles;
  }

  // Returns
  if (p.startsWith('returns/returns/my_returns') || p.startsWith('returns/my_returns')) {
    return [];
  }
  if (p.startsWith('returns/returns') || p.startsWith('returns')) {
    return [];
  }

  // Bookings
  if (p.startsWith('bookings/cart')) {
    return { items: [], total: 0 };
  }
  if (p.startsWith('bookings/waitlist')) {
    return [];
  }
  if (p.startsWith('bookings')) {
    return [];
  }

  // Product recommendations (must come before single product)
  const recMatch = p.match(/^products\/(\d+)\/recommendations$/);
  if (recMatch) {
    const id = parseInt(recMatch[1], 10);
    const others = products.filter((pr: any) => pr.id !== id);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 4);
    return { recommendations: shuffled };
  }

  // Product detail by ID
  const productMatch = p.match(/^products\/(\d+)$/);
  if (productMatch) {
    const id = parseInt(productMatch[1], 10);
    return products.find((pr: any) => pr.id === id) || null;
  }

  // Reviews list
  if (p === 'reviews/reviews' || p.startsWith('reviews/reviews?')) {
    return reviews;
  }

  // Reviews (general catch-all for other review endpoints)
  if (p.startsWith('reviews')) {
    return reviews;
  }

  // Notifications
  if (p.startsWith('notifications')) {
    return [];
  }

  // Analytics
  if (p.startsWith('analytics')) {
    return { revenue: 0, bookings: 0, users: 0 };
  }

  // Wallet
  if (p === 'wallet' || p === 'wallet/') {
    return {
      balance: 45250,
      escrow_total: 12800,
      transactions: [
        { id: 'TX-9021', type: 'ESCROW_HELD', amount: 1250, date: new Date().toISOString(), note: 'حجز فستان سهرة - مرجع #2041', hash: '0x8f2d...23e1' },
        { id: 'TX-8942', type: 'INCOME', amount: 8500, date: new Date(Date.now() - 86400000).toISOString(), note: 'تسوية حجز معدات تصوير', hash: '0x4e5f...6g7h' },
        { id: 'TX-8811', type: 'EXPENDITURE', amount: 2100, date: new Date(Date.now() - 172800000).toISOString(), note: 'رسوم فحص تقني - كاميرا سوني', hash: '0x9i0j...k1l2' },
      ]
    };
  }

  // Wallet deposit/withdraw/transfer
  if (p.startsWith('wallet/deposit') || p.startsWith('wallet/withdraw') || p.startsWith('wallet/transfer')) {
    return { success: true, message: 'تمت العملية بنجاح', new_balance: 45250 };
  }

  // Subscriptions
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
      ]
    };
  }

  // Disputes
  if (p.startsWith('disputes')) {
    return [];
  }

  // Warranties / Insurance
  if (p.startsWith('warranties/insurance')) {
    return { recommended_plan: null, plans: mockInsurancePlans };
  }

  // Auth
  if (p.startsWith('auth')) {
    return { user: null };
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

  // Products list (general)
  if (p === 'products' || p === 'products/') {
    return products;
  }

  // Fallback
  return {};
}

function wrap(data: unknown) {
  return { success: true, data };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const joined = (path || []).join('/');
  const data = resolveGetMock(joined);
  return NextResponse.json(wrap(data));
}

export async function POST(
  _request: NextRequest,
  _ctx: { params: Promise<{ path?: string[] }> },
) {
  return NextResponse.json({
    success: true,
    message_ar: 'تمت العملية بنجاح',
    message_en: 'Operation successful',
  });
}

export async function PUT(
  _request: NextRequest,
  _ctx: { params: Promise<{ path?: string[] }> },
) {
  return NextResponse.json({
    success: true,
    message_ar: 'تمت العملية بنجاح',
    message_en: 'Operation successful',
  });
}

export async function PATCH(
  _request: NextRequest,
  _ctx: { params: Promise<{ path?: string[] }> },
) {
  return NextResponse.json({
    success: true,
    message_ar: 'تمت العملية بنجاح',
    message_en: 'Operation successful',
  });
}

export async function DELETE(
  _request: NextRequest,
  _ctx: { params: Promise<{ path?: string[] }> },
) {
  return NextResponse.json({ success: true });
}
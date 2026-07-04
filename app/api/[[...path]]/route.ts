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

  // Vendors
  if (p === 'vendors' || p === 'vendors/vendors') {
    return vendors;
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
  if (p.startsWith('wallet')) {
    return { balance: 0, transactions: [] };
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
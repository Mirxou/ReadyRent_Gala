import { NextRequest, NextResponse } from 'next/server';
import { bundles, products } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.toLowerCase() || '';

  let filtered = [...bundles];

  if (search) {
    filtered = filtered.filter(
      (b) =>
        b.name_ar.includes(search) ||
        b.name.toLowerCase().includes(search) ||
        b.description_ar.includes(search)
    );
  }

  // Enrich bundles with actual product data
  const enriched = filtered.map((bundle) => ({
    ...bundle,
    products_data: bundle.products.map((pid) => products.find((p) => p.id === pid)).filter(Boolean),
  }));

  return NextResponse.json({ success: true, data: enriched });
}
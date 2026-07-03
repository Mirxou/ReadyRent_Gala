import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category')?.toLowerCase() || '';
  const location = searchParams.get('location')?.toLowerCase() || '';
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const availability = searchParams.get('availability')?.toLowerCase() || '';
  const ordering = searchParams.get('ordering') || '';

  let filtered = [...products];

  // Search by name
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name_ar.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.category_name.toLowerCase().includes(search)
    );
  }

  // Filter by category slug
  if (category) {
    filtered = filtered.filter(
      (p) => p.category?.slug?.toLowerCase() === category || p.category_name.toLowerCase().includes(category)
    );
  }

  // Filter by location
  if (location) {
    filtered = filtered.filter(
      (p) => p.location.toLowerCase().includes(location) || p.location_name.toLowerCase().includes(location)
    );
  }

  // Filter by price range
  if (minPrice) {
    filtered = filtered.filter((p) => p.price_per_day >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter((p) => p.price_per_day <= Number(maxPrice));
  }

  // Filter by availability
  if (availability === 'available') {
    filtered = filtered.filter((p) => p.is_available);
  } else if (availability === 'unavailable') {
    filtered = filtered.filter((p) => !p.is_available);
  }

  // Sorting
  if (ordering === 'price_asc') {
    filtered.sort((a, b) => a.price_per_day - b.price_per_day);
  } else if (ordering === 'price_desc') {
    filtered.sort((a, b) => b.price_per_day - a.price_per_day);
  } else if (ordering === 'popularity') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (ordering === 'newest') {
    filtered.sort((a, b) => b.id - a.id);
  }

  const response = { success: true, data: filtered };
  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: { message: 'POST received', body } });
}
import { NextRequest, NextResponse } from 'next/server';
import { vendors } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const location = searchParams.get('location')?.toLowerCase() || '';
  const search = searchParams.get('search')?.toLowerCase() || '';

  let filtered = [...vendors];

  if (location) {
    filtered = filtered.filter((v) => v.location.toLowerCase().includes(location));
  }

  if (search) {
    filtered = filtered.filter(
      (v) =>
        v.name_ar.includes(search) ||
        v.name.toLowerCase().includes(search) ||
        v.description_ar.includes(search)
    );
  }

  const response = { success: true, data: filtered };
  return NextResponse.json(response);
}
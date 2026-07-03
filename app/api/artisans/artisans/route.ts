import { NextRequest, NextResponse } from 'next/server';
import { artisans } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const specialty = searchParams.get('specialty')?.toLowerCase() || '';
  const location = searchParams.get('location')?.toLowerCase() || '';
  const search = searchParams.get('search')?.toLowerCase() || '';

  let filtered = [...artisans];

  if (specialty) {
    filtered = filtered.filter(
      (a) => a.specialty_ar.toLowerCase().includes(specialty) || a.specialty.toLowerCase().includes(specialty)
    );
  }

  if (location) {
    filtered = filtered.filter((a) => a.location.toLowerCase().includes(location));
  }

  if (search) {
    filtered = filtered.filter(
      (a) =>
        a.name_ar.includes(search) ||
        a.name.toLowerCase().includes(search) ||
        a.bio_ar.includes(search)
    );
  }

  return NextResponse.json({ success: true, data: filtered });
}
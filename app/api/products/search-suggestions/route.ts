import { NextRequest, NextResponse } from 'next/server';
import { products, categories } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json({ success: true, data: [] });
  }

  const suggestions: string[] = [];

  // Search product names
  products.forEach((p) => {
    if (p.name_ar.includes(query)) suggestions.push(p.name_ar);
    if (p.name.toLowerCase().includes(query)) suggestions.push(p.name);
  });

  // Search category names
  categories.forEach((c) => {
    if (c.name_ar.includes(query)) suggestions.push(c.name_ar);
  });

  // Deduplicate and limit to 8
  const unique = [...new Set(suggestions)].slice(0, 8);

  return NextResponse.json({ success: true, data: unique });
}
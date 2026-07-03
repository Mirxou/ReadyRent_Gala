import { NextResponse } from 'next/server';
import { categories } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ success: true, data: categories });
}
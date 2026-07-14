import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// GET /api/bundles/[id] — Get bundle with items and product details
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const bundle = await db.bundle.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!bundle) {
    return NextResponse.json(
      { success: false, message: 'الباقة غير موجودة' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: bundle });
}
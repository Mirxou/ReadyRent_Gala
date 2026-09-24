// ─── GET /api/merchants — list all merchants ──────────────────────────

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toMerchantDTO } from '@/lib/dto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const merchants = await db.merchant.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ merchants: merchants.map((m) => toMerchantDTO(m)) });
}

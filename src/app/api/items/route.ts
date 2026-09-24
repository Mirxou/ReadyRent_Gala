// ─── GET  /api/items — list rental items (merchant + rating aggregate) ─
// ─── POST /api/items — create a new rental item (merchant side) ───────

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toItemDTO, zodMessage } from '@/lib/dto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [items, reviewGroups] = await Promise.all([
    db.item.findMany({
      include: { merchant: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.review.groupBy({
      by: ['itemId'],
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const byItem = new Map(reviewGroups.map((g) => [g.itemId, g]));
  const payload = items.map((item) => {
    const g = byItem.get(item.id);
    const avg = g?._avg.rating ?? null;
    return toItemDTO(item, {
      avg: avg === null ? null : Math.round(avg * 10) / 10, // 1 decimal
      count: g?._count._all ?? 0,
    });
  });

  return NextResponse.json({ items: payload });
}

const createItemSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  dailyRate: z.number().positive(),
  deposit: z.number().min(0).default(0),
  insuranceFee: z.number().min(0).default(0),
  merchantId: z.string().min(1),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `بيانات غير صالحة: ${zodMessage(parsed.error.issues)}` },
      { status: 400 },
    );
  }

  const merchant = await db.merchant.findUnique({
    where: { id: parsed.data.merchantId },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'التاجر غير موجود' }, { status: 400 });
  }

  const item = await db.item.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      dailyRate: parsed.data.dailyRate,
      deposit: parsed.data.deposit,
      insuranceFee: parsed.data.insuranceFee,
      merchantId: parsed.data.merchantId,
    },
    include: { merchant: true },
  });

  return NextResponse.json({ item: toItemDTO(item) }, { status: 201 });
}

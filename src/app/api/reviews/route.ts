// ─── POST /api/reviews — create review (STRICT: COMPLETED only) ───────
// ─── GET  /api/reviews?itemId= — reviews per item / latest 50 ─────────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toReviewDTO, zodMessage } from '@/lib/dto';

export const dynamic = 'force-dynamic';

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  customerId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `بيانات غير صالحة: ${zodMessage(parsed.error.issues)}` },
      { status: 400 },
    );
  }
  const { bookingId, customerId, rating, comment } = parsed.data;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });
  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }
  if (booking.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'لا يمكن التقييم إلا بعد اكتمال الحجز وإرجاع المعدة' },
      { status: 403 },
    );
  }
  if (booking.customerId !== customerId) {
    return NextResponse.json(
      { error: 'لا يمكنك التقييم إلا على حجوزاتك الخاصة' },
      { status: 403 },
    );
  }
  if (booking.review) {
    return NextResponse.json(
      { error: 'تم تقييم هذا الحجز مسبقاً' },
      { status: 409 },
    );
  }

  const review = await db.review.create({
    data: {
      bookingId,
      itemId: booking.itemId,
      customerId,
      rating,
      comment: comment ?? null,
    },
    include: { customer: true },
  });

  return NextResponse.json({ review: toReviewDTO(review) }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get('itemId');
  const reviews = await db.review.findMany({
    where: itemId ? { itemId } : undefined,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: itemId ? undefined : 50,
  });
  return NextResponse.json({ reviews: reviews.map((r) => toReviewDTO(r)) });
}

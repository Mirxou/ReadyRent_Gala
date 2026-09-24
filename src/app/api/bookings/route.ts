// ─── GET  /api/bookings — list bookings (by customerId / merchantId) ──
// ─── POST /api/bookings — create booking (status PENDING_PAYMENT) ─────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toBookingDTO, zodMessage } from '@/lib/dto';
import { computeLateFeePerDay, computeQuote, countDays } from '@/lib/escrow';

export const dynamic = 'force-dynamic';

const bookingInclude = {
  item: { include: { merchant: true } },
  customer: true,
  review: { include: { customer: true } },
} satisfies Prisma.BookingInclude;

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customerId');
  const merchantId = request.nextUrl.searchParams.get('merchantId');

  const where: Prisma.BookingWhereInput = {};
  if (customerId) where.customerId = customerId;
  if (merchantId) where.item = { merchantId };

  const bookings = await db.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const now = new Date();
  return NextResponse.json({
    bookings: bookings.map((b) => toBookingDTO(b, now)),
  });
}

const createBookingSchema = z.object({
  itemId: z.string().min(1),
  customerId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const MAX_DAYS = 30;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `بيانات غير صالحة: ${zodMessage(parsed.error.issues)}` },
      { status: 400 },
    );
  }
  const { itemId, customerId, startDate, endDate } = parsed.data;

  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: 'المعدة غير موجودة' }, { status: 400 });
  }
  if (!item.available) {
    return NextResponse.json(
      { error: 'المعدة غير متاحة للكراء حالياً' },
      { status: 400 },
    );
  }

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 400 });
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return NextResponse.json(
      { error: 'تاريخ نهاية الكراء يجب أن يكون بعد تاريخ البداية' },
      { status: 400 },
    );
  }

  const days = countDays(startDate, endDate);
  if (days > MAX_DAYS) {
    return NextResponse.json(
      { error: `أقصى مدة للكراء هي ${MAX_DAYS} يوماً` },
      { status: 400 },
    );
  }

  const quote = computeQuote({
    dailyRate: item.dailyRate,
    days,
    deposit: item.deposit,
    insuranceFee: item.insuranceFee,
  });

  const booking = await db.booking.create({
    data: {
      itemId,
      customerId,
      startDate,
      endDate,
      days,
      rentalPrice: quote.rentalPrice,
      deposit: quote.deposit,
      insuranceFee: quote.insuranceFee,
      totalPrice: quote.totalPrice,
      lateFeePerDay: computeLateFeePerDay(item.dailyRate),
      status: 'PENDING_PAYMENT',
      depositHeld: 0,
    },
    include: bookingInclude,
  });

  return NextResponse.json(
    { booking: toBookingDTO(booking) },
    { status: 201 },
  );
}

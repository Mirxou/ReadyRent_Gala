// ─── Server-side Prisma → DTO mappers (shared by API routes) ─────────
// Keeps every route consistent with the shared contract in types.ts.

import type {
  Booking,
  Customer,
  EmailLog,
  Item,
  Merchant,
  Review,
} from '@prisma/client';
import type {
  BookingDTO,
  BookingStatus,
  CustomerDTO,
  EmailDTO,
  ItemDTO,
  MerchantDTO,
  ReviewDTO,
} from '@/lib/types';

// ─── Merchant / Customer ─────────────────────────────────────────────
export function toMerchantDTO(m: Merchant): MerchantDTO {
  return { id: m.id, name: m.name, email: m.email, phone: m.phone };
}

export function toCustomerDTO(c: Customer): CustomerDTO {
  return { id: c.id, name: c.name, email: c.email, phone: c.phone };
}

// ─── Review ──────────────────────────────────────────────────────────
type ReviewWithCustomer = Review & { customer: Customer };

export function toReviewDTO(r: ReviewWithCustomer): ReviewDTO {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    customerId: r.customerId,
    customerName: r.customer.name,
    bookingId: r.bookingId,
  };
}

// ─── Item ────────────────────────────────────────────────────────────
type ItemWithMerchant = Item & { merchant: Merchant };

export interface ItemRatingAggregate {
  avg: number | null;
  count: number;
}

export function toItemDTO(
  item: ItemWithMerchant,
  rating: ItemRatingAggregate = { avg: null, count: 0 },
): ItemDTO {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    imageUrl: item.imageUrl,
    dailyRate: item.dailyRate,
    deposit: item.deposit,
    insuranceFee: item.insuranceFee,
    hasDeposit: item.deposit > 0,
    available: item.available,
    merchant: toMerchantDTO(item.merchant),
    ratingAvg: rating.avg,
    reviewsCount: rating.count,
  };
}

// ─── Booking (with computed escrow fields) ───────────────────────────
type BookingWithRelations = Booking & {
  item: Item & { merchant: Merchant };
  customer: Customer;
  review?: ReviewWithCustomer | null;
};

export function toBookingDTO(
  b: BookingWithRelations,
  now: Date = new Date(),
): BookingDTO {
  const status = b.status as BookingStatus;
  const isOverdueNow =
    (status === 'CONFIRMED' || status === 'OVERDUE') &&
    now.getTime() > b.endDate.getTime();
  const projectedRefund =
    status === 'COMPLETED'
      ? b.depositReturned
      : Math.max(0, b.deposit - b.lateFee);

  return {
    id: b.id,
    itemId: b.itemId,
    item: {
      id: b.item.id,
      name: b.item.name,
      category: b.item.category,
      imageUrl: b.item.imageUrl,
      dailyRate: b.item.dailyRate,
      merchant: toMerchantDTO(b.item.merchant),
    },
    customerId: b.customerId,
    customerName: b.customer.name,
    customerEmail: b.customer.email,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    days: b.days,
    rentalPrice: b.rentalPrice,
    deposit: b.deposit,
    insuranceFee: b.insuranceFee,
    totalPrice: b.totalPrice,
    lateFeePerDay: b.lateFeePerDay,
    lateFee: b.lateFee,
    depositHeld: b.depositHeld,
    depositReturned: b.depositReturned,
    status,
    paymentRef: b.paymentRef,
    paidAt: b.paidAt ? b.paidAt.toISOString() : null,
    returnedAt: b.returnedAt ? b.returnedAt.toISOString() : null,
    lateWarningSent: b.lateWarningSent,
    createdAt: b.createdAt.toISOString(),
    review: b.review ? toReviewDTO(b.review) : null,
    isOverdueNow,
    projectedRefund,
  };
}

// ─── EmailLog ────────────────────────────────────────────────────────
export function toEmailDTO(e: EmailLog): EmailDTO {
  return {
    id: e.id,
    toEmail: e.toEmail,
    toName: e.toName,
    subject: e.subject,
    body: e.body,
    type: e.type as EmailDTO['type'],
    bookingId: e.bookingId,
    sentAt: e.sentAt.toISOString(),
  };
}

// ─── Zod error → readable Arabic-ish message ─────────────────────────
export function zodMessage(
  issues: readonly { path?: readonly PropertyKey[]; message: string }[],
): string {
  const first = issues[0];
  if (!first) return 'بيانات الطلب غير صالحة';
  const last = first.path?.[first.path.length - 1];
  return last !== undefined
    ? `الحقل «${String(last)}» — ${first.message}`
    : first.message;
}

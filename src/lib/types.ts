// ─── Shared API contract types (used by frontend + backend) ──────────

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED';

export type EmailType =
  | 'PAYMENT_RECEIPT'
  | 'MERCHANT_NEW_ORDER'
  | 'LATE_WARNING'
  | 'ESCROW_RELEASE';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'بانتظار الدفع',
  CONFIRMED: 'مؤكَّد / قيد الاستئجار',
  OVERDUE: 'متأخر عن الإرجاع',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  PAYMENT_RECEIPT: 'إيصال دفع (للزبون)',
  MERCHANT_NEW_ORDER: 'طلب جديد (للتاجر)',
  LATE_WARNING: 'إنذار تأخير (للزبون)',
  ESCROW_RELEASE: 'فك حجز الضمان (للزبون)',
};

export interface MerchantDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customerId: string;
  customerName: string;
  bookingId: string;
}

export interface ItemDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  dailyRate: number;
  deposit: number;
  insuranceFee: number;
  hasDeposit: boolean;
  available: boolean;
  merchant: MerchantDTO;
  ratingAvg: number | null;
  reviewsCount: number;
}

export interface BookingDTO {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string | null;
    dailyRate: number;
    merchant: MerchantDTO;
  };
  customerId: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  days: number;
  rentalPrice: number;
  deposit: number;
  insuranceFee: number;
  totalPrice: number;
  lateFeePerDay: number;
  lateFee: number;
  depositHeld: number;
  depositReturned: number;
  status: BookingStatus;
  paymentRef?: string | null;
  paidAt?: string | null;
  returnedAt?: string | null;
  lateWarningSent: boolean;
  createdAt: string;
  review?: ReviewDTO | null;
  isOverdueNow: boolean;
  projectedRefund: number;
}

export interface EmailDTO {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  type: EmailType;
  bookingId?: string | null;
  sentAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

// ─── API response envelopes ──────────────────────────────────────────
export interface ApiError {
  error: string;
}

export interface ItemsResponse {
  items: ItemDTO[];
}

export interface BookingsResponse {
  bookings: BookingDTO[];
}

export interface BookingResponse {
  booking: BookingDTO;
}

export interface ReviewsResponse {
  reviews: ReviewDTO[];
}

export interface EmailsResponse {
  emails: EmailDTO[];
}

export interface LateCheckResponse {
  checked: number;
  newlyOverdue: number;
  warningsSent: number;
  totalLateFees: number;
}

export interface CustomersResponse {
  customers: CustomerDTO[];
}

export interface MerchantsResponse {
  merchants: MerchantDTO[];
}

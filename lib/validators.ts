// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Shared Zod Validation Schemas
// Used across critical API routes for consistent input validation
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ──── Auth ────
export const registerSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
  username: z.string().min(3).max(30).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['customer', 'vendor']).optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمة المرور وتأكيدها غير متطابقتين',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// ──── Bookings ────
export const createBookingSchema = z.object({
  product_id: z.string().min(1, 'معرف المنتج مطلوب'),
  start_date: z.string().refine(v => !isNaN(Date.parse(v)), 'تاريخ البداية غير صالح'),
  end_date: z.string().refine(v => !isNaN(Date.parse(v)), 'تاريخ النهاية غير صالح'),
  quantity: z.number().int().min(1).default(1),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  product_name: z.string().max(255).optional(),
  product_image: z.string().max(500).optional(),
  has_insurance: z.boolean().optional(),
  extra_services: z.array(z.any()).optional(),
  escrow_status: z.string().optional(),
}).refine(d => new Date(d.start_date) < new Date(d.end_date), {
  message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
  path: ['start_date'],
}).refine(d => new Date(d.start_date) >= new Date(), {
  message: 'تاريخ البداية لا يمكن أن يكون في الماضي',
  path: ['start_date'],
});

// ──── Payments ────
export const createPaymentSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون رقماً موجباً'),
  method: z.enum(['baridimob', 'ccp', 'bank_card', 'wallet', 'card']).default('card'),
  booking_id: z.string().optional(),
  escrow_status: z.string().optional(),
  redirect_url: z.string().url().optional().or(z.literal('')),
});

// ──── Disputes ────
export const createDisputeSchema = z.object({
  booking_id: z.string().min(1, 'معرف الحجز مطلوب'),
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(255),
  reason: z.string().min(10, 'السبب يجب أن يكون 10 أحرف على الأقل').max(2000),
  description: z.string().max(2000).optional(),
  claim_type: z.enum(['damage', 'non_delivery', 'quality', 'wrong_item', 'late_return', 'general']).default('general'),
  claimed_amount: z.number().min(0).max(1000000, 'المبلغ المطلوب يتجاوز الحد الأقصى (1,000,000 د.ج)').optional(),
  evidence_urls: z.array(z.string().url('رابط الأدلة غير صالح').max(500)).max(10, 'الحد الأقصى 10 أدلة').optional(),
});

// ──── Wallet ────
export const walletDepositSchema = z.object({
  amount: z.number().int().positive('المبلغ يجب أن يكون رقماً موجباً').max(100000, 'الحد الأقصى للإيداع 100,000 د.ج للمعاملة الواحدة'),
  method: z.enum(['baridimob', 'ccp', 'bank_card', 'admin_topup']).optional(),
  reference: z.string().min(6, 'رقم المرجع يجب أن يكون 6 أحرف على الأقل').max(100).optional(),
});

export const walletWithdrawSchema = z.object({
  amount: z.number().int().positive('المبلغ يجب أن يكون رقماً موجباً').max(50000, 'الحد الأقصى للسحب 50,000 د.ج للمعاملة الواحدة'),
  method: z.enum(['baridimob', 'ccp', 'bank_card'], { message: 'طريقة السحب غير صالحة' }),
});

export const walletTransferSchema = z.object({
  recipient_id: z.string().min(1, 'معرف المستلم مطلوب'),
  amount: z.number().int().positive('المبلغ يجب أن يكون رقماً موجباً').max(10000, 'الحد الأقصى للتحويل 10,000 د.ج للمعاملة الواحدة'),
  note: z.string().max(200).optional(),
});

// ──── Reviews ────
export const createReviewSchema = z.object({
  product_id: z.string().min(1, 'معرف المنتج مطلوب'),
  rating: z.number().int().min(1).max(5, 'التقييم يجب أن يكون بين 1 و 5'),
  comment: z.string().min(10, 'التعليق يجب أن يكون 10 أحرف على الأقل').max(2000),
  booking_id: z.string().optional(),
});

// ──── Verification ────
export const verificationVoteSchema = z.object({
  verification_id: z.string().min(1, 'معرف التحقق مطلوب'),
  vote: z.enum(['approve', 'reject'], { message: 'التصويت يجب أن يكون "approve" أو "reject"' }),
  comment: z.string().max(500).optional(),
});

// ──── Helper: validate body and return parsed result or error response ────
export function validateBody<T>(schema: z.ZodType<T>, body: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: z.ZodError;
  message: string;
} {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: result.error,
      message: firstError?.message || 'بيانات غير صالحة',
    };
  }
  return { success: true, data: result.data };
}

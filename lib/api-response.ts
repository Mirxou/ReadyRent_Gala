// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Unified API Response Helpers
// Single source of truth for all API error/success shapes
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

/**
 * Canonical sovereign error response
 * Usage: return sovereignError('USER_NOT_FOUND', 404, 'المستخدم غير موجود', 'User not found')
 */
export function sovereignError(
  code: string,
  status: number,
  message_ar: string,
  message_en: string,
) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar,
      message_en,
      code,
    },
    { status },
  );
}

/**
 * Canonical sovereign success response
 * Usage: return sovereignSuccess(data)
 */
export function sovereignSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

/**
 * Shorthand for common error codes
 */
export const errors = {
  unauthorized: () =>
    sovereignError('AUTH_REQUIRED', 401, 'يجب تسجيل الدخول', 'Authentication required'),

  forbidden: () =>
    sovereignError('FORBIDDEN', 403, 'ليس لديك صلاحية', 'Access denied'),

  notFound: (ar = 'غير موجود', en = 'Not found') =>
    sovereignError('NOT_FOUND', 404, ar, en),

  invalidInput: (ar = 'مدخلات غير صالحة', en = 'Invalid input') =>
    sovereignError('INVALID_INPUT', 400, ar, en),

  internal: () =>
    sovereignError('INTERNAL_ERROR', 500, 'حدث خطأ داخلي', 'Internal server error'),

  conflict: (ar = 'تعارض في البيانات', en = 'Conflict') =>
    sovereignError('CONFLICT', 409, ar, en),

  rateLimited: () =>
    sovereignError('RATE_LIMITED', 429, 'طلبات كثيرة، حاول لاحقاً', 'Too many requests'),
};

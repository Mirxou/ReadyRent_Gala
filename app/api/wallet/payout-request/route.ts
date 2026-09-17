import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { checkWalletRateLimit } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/payout-request — Vendor requests withdrawal
// Aggregates all PayoutRecord with status='pending_payout' for this user,
// creates a WithdrawalRequest, marks PayoutRecords as 'processing'.
//
// GET /api/wallet/payout-request — List vendor's withdrawal history
// ═══════════════════════════════════════════════════════════════

const MIN_WITHDRAWAL_AMOUNT = 2000; // 2000 DZD minimum

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const withdrawals = await db.withdrawalRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: withdrawals.map(w => ({
        id: w.id,
        amount: w.amount,
        method: w.method,
        status: w.status,
        admin_note: w.adminNote,
        requested_at: w.requestedAt.toISOString(),
        processed_at: w.processedAt?.toISOString() ?? null,
        created_at: w.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Payout Request GET', 'Error', error);
    return NextResponse.json({ success: false, message_en: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const rateCheck = checkWalletRateLimit(session.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, dignity_preserved: true, message_en: 'Too many requests', code: 'RATE_LIMITED' }, { status: 429 });
    }

    const body = await request.json();
    const { method } = body as { method?: string };

    if (!method || !['CCP', 'BARIDIMOB'].includes(method.toUpperCase())) {
      return NextResponse.json({ success: false, dignity_preserved: true, message_en: 'Method must be CCP or BARIDIMOB', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const payoutMethod = method.toUpperCase();

    // 1. Fetch all pending payout records for this user
    const pendingPayouts = await db.payoutRecord.findMany({
      where: { userId: session.userId, status: 'pending_payout' },
      select: { id: true, amount: true, bookingId: true },
    });

    if (pendingPayouts.length === 0) {
      return NextResponse.json({ success: false, dignity_preserved: true, message_ar: 'لا توجد أرباح متاحة للسحب', message_en: 'No pending payouts available', code: 'NO_PENDING_PAYOUTS' }, { status: 400 });
    }

    const totalAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

    if (totalAmount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json({ success: false, dignity_preserved: true, message_ar: `الحد الأدنى للسحب هو ${MIN_WITHDRAWAL_AMOUNT} دج — رصيدك المتاح: ${totalAmount} دج`, message_en: `Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} DZD. Available: ${totalAmount}`, code: 'BELOW_MINIMUM' }, { status: 400 });
    }

    // 2. Verify payout account info exists
    const vendor = await db.vendor.findFirst({
      where: { userId: session.userId },
      select: { id: true, ccpAccount: true, ccpKey: true, ccpName: true, baridimobPhone: true },
    });

    if (payoutMethod === 'CCP') {
      if (!vendor?.ccpAccount || !vendor?.ccpName) {
        return NextResponse.json({ success: false, dignity_preserved: true, message_ar: 'يرجى إدخال معلومات حساب CCP أولاً (رقم الحساب + الاسم)', message_en: 'Please set up CCP account info first', code: 'MISSING_PAYOUT_INFO' }, { status: 400 });
      }
    } else {
      if (!vendor?.baridimobPhone) {
        return NextResponse.json({ success: false, dignity_preserved: true, message_ar: 'يرجى إدخال رقم هاتف BaridiMob أولاً', message_en: 'Please set up BaridiMob phone first', code: 'MISSING_PAYOUT_INFO' }, { status: 400 });
      }
    }

    // 3. Create withdrawal request + mark payouts as processing (atomic)
    const payoutIds = pendingPayouts.map(p => p.id);

    const result = await db.$transaction([
      // Create withdrawal request
      db.withdrawalRequest.create({
        data: {
          userId: session.userId,
          amount: totalAmount,
          method: payoutMethod,
          status: 'PENDING',
          payoutRecordIds: JSON.stringify(payoutIds),
        },
      }),
      // Mark all payout records as processing
      db.payoutRecord.updateMany({
        where: { id: { in: payoutIds } },
        data: { status: 'processing' },
      }),
      // Notify the user
      db.notification.create({
        data: {
          userId: session.userId,
          type: 'financial',
          title: 'تم استلام طلب السحب',
          message: `تم استلام طلب سحب بقيمة ${totalAmount} دج عبر ${payoutMethod === 'CCP' ? 'حساب CCP' : 'BaridiMob'}. سيتم التحويل خلال 48 ساعة.`,
        },
      }),
      // Audit log
      db.activityLog.create({
        data: {
          userId: session.userId,
          action: 'payout_request',
          target: session.userId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        },
      }),
    ]);

    const withdrawal = result[0];

    logger.info('Payout Request', `User ${session.userId} requested withdrawal of ${totalAmount} DZD via ${payoutMethod}`, { withdrawalId: withdrawal.id, payoutCount: pendingPayouts.length });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: withdrawal.id,
        amount: totalAmount,
        method: payoutMethod,
        status: 'PENDING',
        payout_count: pendingPayouts.length,
        message: `تم استلام طلب سحب ${totalAmount} دج. سيتم التحويل خلال 48 ساعة.`,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('Payout Request POST', 'Error', error);
    return NextResponse.json({ success: false, dignity_preserved: true, message_en: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

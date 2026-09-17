import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/wallet/balance — Vendor earnings overview
// Returns: available (pending_payout), processing, held (escrow), withdrawn
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // 1. Pending payouts (available for withdrawal)
    const pendingPayouts = await db.payoutRecord.aggregate({
      where: { userId: session.userId, status: 'pending_payout' },
      _sum: { amount: true },
    });
    const available = pendingPayouts._sum.amount ?? 0;

    // 2. Processing payouts (withdrawal requested, waiting for admin)
    const processingPayouts = await db.payoutRecord.aggregate({
      where: { userId: session.userId, status: 'processing' },
      _sum: { amount: true },
    });
    const processing = processingPayouts._sum.amount ?? 0;

    // 3. Escrow held (active bookings where vendor's product is booked)
    // This is the money held in escrow that will become available after the booking completes
    const heldBookings = await db.booking.findMany({
      where: {
        product: { vendorId: session.userId },
        escrowStatus: 'held',
        status: { in: ['confirmed', 'active'] },
      },
      select: { depositAmount: true, rentalFee: true },
    });
    const heldInEscrow = heldBookings.reduce((sum, b) => sum + (b.depositAmount || 0) + (b.rentalFee || 0), 0);

    // 4. Total withdrawn (completed payouts)
    const completedPayouts = await db.payoutRecord.aggregate({
      where: { userId: session.userId, status: 'paid' },
      _sum: { amount: true },
    });
    const totalWithdrawn = completedPayouts._sum.amount ?? 0;

    // 5. Wallet balance (from direct wallet operations — deposits, transfers in)
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { walletBalance: true },
    });
    const walletBalance = user?.walletBalance ?? 0;

    // 6. Vendor payout account info
    const vendor = await db.vendor.findFirst({
      where: { userId: session.userId },
      select: { ccpAccount: true, ccpKey: true, ccpName: true, baridimobPhone: true },
    });

    // 7. Pending withdrawal requests
    const pendingWithdrawals = await db.withdrawalRequest.count({
      where: { userId: session.userId, status: { in: ['PENDING', 'PROCESSING'] } },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        available: available,              // الأرباح المتاحة للسحب
        processing: processing,            // قيد المعالجة
        held_in_escrow: heldInEscrow,      // محتجز في الضمان (سيُحرر بعد الإرجاع)
        total_withdrawn: totalWithdrawn,   // إجمالي المسحوبات السابقة
        wallet_balance: walletBalance,     // رصيد المحفظة الداخلي
        pending_withdrawals: pendingWithdrawals, // عدد طلبات السحب المعلقة
        payout_account: vendor ? {
          ccp_account: vendor.ccpAccount,
          ccp_name: vendor.ccpName,
          ccp_key: vendor.ccpKey ? '***' + vendor.ccpKey.slice(-2) : null, // masked
          baridimob_phone: vendor.baridimobPhone,
          is_configured: !!(vendor.ccpAccount || vendor.baridimobPhone),
        } : null,
      },
    });
  } catch (error) {
    logger.error('Wallet Balance', 'Error', error);
    return NextResponse.json({ success: false, message_en: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

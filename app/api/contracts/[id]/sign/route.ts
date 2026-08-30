import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// POST /api/contracts/[id]/sign — Sign a contract
// Only updates contract status to 'signed' with renter signature.
// Does NOT touch booking.status — that's handled by webhook on payment.
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params;
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const contract = await db.contract.findUnique({
    where: { id },
    include: { booking: true },
  });

  if (!contract?.booking) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'العقد غير موجود', message_en: 'Contract not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Prevent double-signing: only draft contracts can be signed
  if (contract.status !== 'draft') {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'لا يمكن توقيع عقد تم توقيعه أو إنهائه مسبقاً', message_en: 'This contract has already been signed or finalized', code: 'CONTRACT_NOT_DRAFT' },
      { status: 409 }
    );
  }

  // Ownership check: only the booking owner or an admin/staff may sign
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user) return authRequiredResponse();
  const isAdmin = user.role === 'admin' || user.role === 'staff';
  if (contract.booking.userId !== session.userId && !isAdmin) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'غير مصرح', message_en: 'Unauthorized', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const ipAddress =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const signedAt = new Date();
  const signatureData = JSON.stringify({ signedAt: signedAt.toISOString(), ipAddress });

  // Update parties: mark renter as signed
  let updatedParties = contract.parties;
  try {
    const parties = JSON.parse(contract.parties || '[]');
    const renterIdx = parties.findIndex((p: Record<string, unknown>) => p.role === 'renter');
    if (renterIdx >= 0) {
      parties[renterIdx].signed = true;
      parties[renterIdx].signedAt = signedAt.toISOString();
      parties[renterIdx].ipAddress = ipAddress;
    }
    updatedParties = JSON.stringify(parties);
  } catch {
    // If parties JSON is corrupt, keep original
  }

  // Update contract: sign + update parties (no booking.status change)
  const updated = await db.contract.update({
    where: { id },
    data: {
      status: 'signed',
      renterSignature: signatureData,
      signedAt,
      parties: updatedParties,
    },
  });

  // Notify vendor
  if (contract.bookingId) {
    const vendorBooking = await db.booking.findUnique({
      where: { id: contract.bookingId },
      select: { product: { select: { vendorId: true, name: true, nameAr: true } } },
    });
    if (vendorBooking?.product?.vendorId) {
      await db.notification.create({
        data: {
          userId: vendorBooking.product.vendorId,
          type: 'system',
          title: 'تم توقيع عقد حجز جديد',
          message: `تم توقيع عقد إيجار ${vendorBooking.product.nameAr || vendorBooking.product.name || ''}. يمكنك البدء في تنفيذ الحجز.`,
        },
      });
    }
  }

  return NextResponse.json({ success: true, dignity_preserved: true, data: updated });
  } catch (error) {
    logger.error('Contract Sign API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

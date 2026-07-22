import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/contracts/[id]/sign — Sign a contract
// Updates contract status to 'signed' and confirms the booking atomically
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params;
  const session = getSessionFromRequest(request);
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

  // Atomic: update contract + confirm booking in a single transaction
  const [updated] = await db.$transaction([
    db.contract.update({
      where: { id },
      data: {
        status: 'signed',
        renterSignature: JSON.stringify({ signedAt: new Date().toISOString(), ipAddress }),
        signedAt: new Date(),
      },
    }),
    // Promote the linked booking to confirmed
    db.booking.update({
      where: { id: contract.bookingId },
      data: { status: 'confirmed' },
    }),
  ]);

  return NextResponse.json({ success: true, dignity_preserved: true, data: updated });
  } catch (error) {
    console.error('[Contract Sign API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

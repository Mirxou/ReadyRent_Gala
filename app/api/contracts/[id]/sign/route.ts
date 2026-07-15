import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/contracts/[id]/sign — Sign a contract
// Updates contract status to 'signed' and confirms the booking
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const contract = await db.contract.findUnique({ where: { id } });

  if (!contract) {
    return NextResponse.json(
      { success: false, message: 'العقد غير موجود' },
      { status: 404 }
    );
  }

  const ipAddress =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const updated = await db.contract.update({
    where: { id },
    data: {
      status: 'signed',
      renterSignature: JSON.stringify({ signedAt: new Date().toISOString(), ipAddress }),
      signedAt: new Date(),
    },
  });

  // Promote the linked booking to confirmed
  if (contract.bookingId) {
    await db.booking.update({
      where: { id: contract.bookingId },
      data: { status: 'confirmed' },
    });
  }

  return NextResponse.json({ success: true, data: updated });
}
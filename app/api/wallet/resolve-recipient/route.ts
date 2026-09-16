// ═══════════════════════════════════════════════════════════════
// GET /api/wallet/resolve-recipient?identifier=<phone_or_email>
// P1 fix: wallet transfer UI lets users type a phone number or email,
// but /api/wallet/transfer requires a recipient_id (CUID).
// This route resolves the human-readable identifier to a CUID.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const identifier = request.nextUrl.searchParams.get('identifier')?.trim();
    if (!identifier || identifier.length < 3) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'المعرّف قصير جداً', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Try email first (case-insensitive), then phone (exact match)
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
        ],
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        trustScore: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'المستلم غير موجود', code: 'RECIPIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Don't reveal if the recipient is the sender themselves — let the transfer route handle that
    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        recipient_id: user.id,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        is_verified: user.isVerified,
        trust_score: user.trustScore,
      },
    });
  } catch (error) {
    logger.error('Wallet ResolveRecipient', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'خطأ داخلي', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

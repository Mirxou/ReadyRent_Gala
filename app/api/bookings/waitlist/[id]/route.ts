import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Waitlist Item — Delete (owner only)
// ═══════════════════════════════════════════════════════════════════

function errorResponse(messageAr: string, messageEn: string, code: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: messageAr,
      message_en: messageEn,
      code,
    },
    { status }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const { id } = await params;

    const item = await db.waitlistItem.findUnique({ where: { id } });

    if (!item) {
      return errorResponse(
        'عنصر قائمة الانتظار غير موجود',
        'Waitlist item not found',
        'NOT_FOUND',
        404
      );
    }

    // Owner check
    if (item.userId !== session.userId) {
      return errorResponse(
        'غير مصرح بحذف هذا العنصر',
        'Unauthorized to delete this item',
        'FORBIDDEN',
        403
      );
    }

    await db.waitlistItem.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id,
        deleted: true,
      },
    });
  } catch (error) {
    console.error('[Waitlist Item API] DELETE error:', error);
    return errorResponse(
      'حدث خطأ أثناء حذف عنصر قائمة الانتظار',
      'An error occurred while deleting the waitlist item',
      'INTERNAL_ERROR',
      500
    );
  }
}
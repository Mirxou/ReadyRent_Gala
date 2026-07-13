import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// CMS Page Single — Public read by slug
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const page = await db.cMSPage.findUnique({ where: { slug } });

    if (!page || page.status !== 'published') {
      return errorResponse(
        'الصفحة غير موجودة',
        'Page not found',
        'NOT_FOUND',
        404
      );
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content ?? '',
        status: page.status,
        created_at: page.createdAt.toISOString(),
        updated_at: page.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[CMS Page API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب الصفحة',
      'An error occurred while fetching the page',
      'INTERNAL_ERROR',
      500
    );
  }
}
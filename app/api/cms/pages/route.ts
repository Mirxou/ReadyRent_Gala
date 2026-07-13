import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// CMS Pages API — Public list
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

export async function GET() {
  try {
    const pages = await db.cMSPage.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content ?? '',
        status: page.status,
        created_at: page.createdAt.toISOString(),
        updated_at: page.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[CMS Pages API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب الصفحات',
      'An error occurred while fetching CMS pages',
      'INTERNAL_ERROR',
      500
    );
  }
}
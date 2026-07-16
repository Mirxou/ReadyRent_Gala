import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// CMS Page Single — GET by slug/id, PUT/DELETE by id (admin/staff)
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

function formatPage(page: { id: string; title: string; slug: string; content: string | null; status: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content ?? '',
    status: page.status,
    created_at: page.createdAt.toISOString(),
    updated_at: page.updatedAt.toISOString(),
  };
}

// GET — public read by slug (or id)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try finding by slug first, then by id
    let page = await db.cMSPage.findUnique({ where: { slug } });
    if (!page) {
      page = await db.cMSPage.findUnique({ where: { id: slug } });
    }

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
      data: formatPage(page),
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

// PUT — admin/staff update by id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return errorResponse(
        'ليس لديك صلاحية لهذا الإجراء',
        'You do not have permission to perform this action',
        'FORBIDDEN',
        403
      );
    }

    const { slug: id } = await params;
    const body = await request.json();
    const { title, slug: newSlug, content, status } = body;

    const existing = await db.cMSPage.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(
        'الصفحة غير موجودة',
        'Page not found',
        'NOT_FOUND',
        404
      );
    }

    // If slug is being changed, check for duplicates
    if (newSlug && newSlug !== existing.slug) {
      const duplicate = await db.cMSPage.findUnique({ where: { slug: newSlug } });
      if (duplicate) {
        return errorResponse(
          'رابط الصفحة موجود بالفعل',
          'A page with this slug already exists',
          'DUPLICATE_SLUG',
          409
        );
      }
    }

    const page = await db.cMSPage.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(newSlug ? { slug: newSlug } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: formatPage(page),
    });
  } catch (error) {
    console.error('[CMS Page API] PUT Error:', error);
    return errorResponse(
      'حدث خطأ أثناء تحديث الصفحة',
      'An error occurred while updating the page',
      'INTERNAL_ERROR',
      500
    );
  }
}

// DELETE — admin/staff delete by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return errorResponse(
        'ليس لديك صلاحية لهذا الإجراء',
        'You do not have permission to perform this action',
        'FORBIDDEN',
        403
      );
    }

    const { slug: id } = await params;

    const existing = await db.cMSPage.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(
        'الصفحة غير موجودة',
        'Page not found',
        'NOT_FOUND',
        404
      );
    }

    await db.cMSPage.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('[CMS Page API] DELETE Error:', error);
    return errorResponse(
      'حدث خطأ أثناء حذف الصفحة',
      'An error occurred while deleting the page',
      'INTERNAL_ERROR',
      500
    );
  }
}
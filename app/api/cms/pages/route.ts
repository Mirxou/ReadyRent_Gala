import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// CMS Pages API — Public list + Admin create
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u0600-\u06FF]+/g, '')
    .replace(/\-+/g, '-');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    const pages = await db.cMSPage.findMany({
      where: includeAll ? {} : { status: 'published' },
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

export async function POST(request: NextRequest) {
  try {
    // Auth check — admin/staff only
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

    const body = await request.json();
    const { title, content, status } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return errorResponse(
        'العنوان مطلوب',
        'Title is required',
        'VALIDATION_ERROR',
        400
      );
    }

    const slug = slugify(title);

    // Check for duplicate slug
    const existing = await db.cMSPage.findUnique({ where: { slug } });
    if (existing) {
      return errorResponse(
        'رابط الصفحة موجود بالفعل',
        'A page with this slug already exists',
        'DUPLICATE_SLUG',
        409
      );
    }

    const page = await db.cMSPage.create({
      data: {
        title: title.trim(),
        slug,
        content: content || '',
        status: status === 'published' ? 'published' : 'draft',
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CMS Pages API] POST Error:', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء الصفحة',
      'An error occurred while creating the page',
      'INTERNAL_ERROR',
      500
    );
  }
}
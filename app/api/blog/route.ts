import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Blog API — Public list + Admin create
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

// ──── GET: Public blog list with pagination & search ────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const where: Record<string, unknown> = { status: 'published' };
    if (search) {
      (where as Record<string, unknown>).title = { contains: search };
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        featured_image: post.imageUrl ?? null,
        status: post.status,
        category: post.category ?? 'عام',
        read_time: post.readTime ?? Math.max(1, Math.ceil((post.content ?? '').length / 500)),
        author_name: post.authorName ?? 'فريق STANDARD.Rent',
        created_at: post.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Blog API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب المقالات',
      'An error occurred while fetching blog posts',
      'INTERNAL_ERROR',
      500
    );
  }
}

// ──── POST: Admin create blog post ────
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return errorResponse(
        'غير مصرح بهذا الإجراء',
        'Unauthorized to perform this action',
        'FORBIDDEN',
        403
      );
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, status } = body;

    if (!title || !content) {
      return errorResponse(
        'العنوان والمحتوى مطلوبان',
        'Title and content are required',
        'VALIDATION_ERROR',
        400
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        imageUrl: coverImage || null,
        status: status || 'draft',
        authorId: session.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featured_image: post.imageUrl,
          status: post.status,
          created_at: post.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Blog API] Create error:', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء المقال',
      'An error occurred while creating the blog post',
      'INTERNAL_ERROR',
      500
    );
  }
}
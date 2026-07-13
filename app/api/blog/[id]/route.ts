import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Blog Single Post API — Public read by id or slug
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try finding by id first, then by slug
    let post = await db.blogPost.findUnique({ where: { id } });
    if (!post) {
      post = await db.blogPost.findUnique({ where: { slug: id } });
    }

    if (!post || post.status !== 'published') {
      return errorResponse(
        'المقال غير موجود',
        'Blog post not found',
        'NOT_FOUND',
        404
      );
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content ?? '',
        excerpt: post.excerpt ?? '',
        featured_image: post.imageUrl ?? null,
        status: post.status,
        author: post.authorId ?? null,
        published_at: post.createdAt.toISOString(),
        created_at: post.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Blog Post API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب المقال',
      'An error occurred while fetching the blog post',
      'INTERNAL_ERROR',
      500
    );
  }
}
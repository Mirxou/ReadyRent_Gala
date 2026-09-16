import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════
// Artisans API — Full database integration
// P1 fix: was `take: limit` with `limit = undefined` when no query param,
// which made Prisma return ALL artisans. Now uses default 20 + max 50 + skip.
// ═══════════════════════════════════════════════════════════════════

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const specialty = searchParams.get('specialty') || '';
    const location = searchParams.get('location') || '';

    // P1 fix: parse + sanitize pagination params (was undefined → ALL rows)
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { specialty: { contains: search } },
        { specialtyAr: { contains: search } },
      ];
    }

    if (specialty) {
      where.OR = [
        ...(Array.isArray(where.OR) ? where.OR : []),
        { specialty: { contains: specialty } },
        { specialtyAr: { contains: specialty } },
        { specialties: { contains: specialty } },
      ];
    }

    if (location) {
      where.location = { contains: location };
    }

    const [artisans, total] = await Promise.all([
      db.artisan.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      db.artisan.count({ where }),
    ]);

    const data = artisans.map((a) => ({
      id: a.id,
      name: a.name,
      name_ar: a.nameAr,
      specialty: a.specialty,
      specialty_ar: a.specialtyAr,
      rating: a.rating,
      location: a.location,
      avatar: a.avatar,
      bio_ar: a.bioAr,
      is_verified: a.isVerified,
      trust_score: a.trustScore,
      completed_orders: a.completedOrders,
      specialties: JSON.parse(a.specialties || '[]'),
      response_time: a.responseTime,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Artisans API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب قائمة الحرفيين',
        message_en: 'An error occurred while fetching artisans',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
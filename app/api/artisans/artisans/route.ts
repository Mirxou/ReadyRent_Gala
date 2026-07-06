import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Artisans API — Full database integration
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const specialty = searchParams.get('specialty') || '';
    const location = searchParams.get('location') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

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

    const artisans = await db.artisan.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

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
    });
  } catch (error) {
    console.error('[Artisans API] Error:', error);
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
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// GET /api/bundles/[id]/calculate-price — Calculate bundle price
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ success: false, message_en: 'start_date and end_date are required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate >= endDate) {
      return NextResponse.json({ success: false, message_en: 'start_date must be before end_date', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const bundle = await db.bundle.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, nameAr: true, pricePerDay: true, primaryImage: true, isAvailable: true } },
          },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json({ success: false, message_en: 'Bundle not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let individualTotal = 0;
    const itemBreakdown = bundle.items.map(item => {
      const dailyRate = item.product?.pricePerDay ?? 0;
      const itemTotal = dailyRate * numberOfDays * (item.quantity || 1);
      individualTotal += itemTotal;
      return {
        product_id: item.productId,
        product_name: item.product?.nameAr || item.product?.name || 'Unknown',
        daily_rate: dailyRate,
        quantity: item.quantity || 1,
        days: numberOfDays,
        item_total: itemTotal,
        is_available: item.product?.isAvailable ?? false,
      };
    });

    // Apply bundle discount
    const discountPercentage = bundle.discountPercentage ?? 0;
    const discountedTotal = individualTotal * (1 - discountPercentage / 100);
    const savings = individualTotal - discountedTotal;

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        bundle_name_ar: bundle.nameAr,
        start_date: startDateStr,
        end_date: endDateStr,
        number_of_days: numberOfDays,
        individual_total: individualTotal,
        discount_percentage: discountPercentage,
        discounted_total: discountedTotal,
        savings: savings,
        items: itemBreakdown,
      },
    });
  } catch (error) {
    console.error('[Bundle Price Calc API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error calculating bundle price', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
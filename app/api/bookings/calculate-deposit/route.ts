import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings/calculate-deposit — Calculate required deposit
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    if (!productId || !startDateStr || !endDateStr) {
      return NextResponse.json({ success: false, message_en: 'product_id, start_date and end_date are required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate >= endDate) {
      return NextResponse.json({ success: false, message_en: 'start_date must be before end_date', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { name: true, nameAr: true, dailyRate: true, weeklyRate: true, monthlyRate: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, message_en: 'Product not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate total based on best rate
    let totalAmount: number;
    if (numberOfDays >= 30 && product.monthlyRate) {
      const months = numberOfDays / 30;
      totalAmount = product.monthlyRate * months;
    } else if (numberOfDays >= 7 && product.weeklyRate) {
      const weeks = numberOfDays / 7;
      totalAmount = product.weeklyRate * weeks;
    } else {
      totalAmount = product.dailyRate * numberOfDays;
    }

    // Sovereign trust system: 30% deposit
    const depositPercentage = 30;
    const depositAmount = Math.ceil((totalAmount * depositPercentage) / 100);
    const remainingAtPickup = totalAmount - depositAmount;

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        product_id: productId,
        product_name: product.nameAr || product.name,
        start_date: startDateStr,
        end_date: endDateStr,
        number_of_days: numberOfDays,
        daily_rate: product.dailyRate,
        total_amount: Math.ceil(totalAmount),
        deposit_percentage: depositPercentage,
        deposit_amount: depositAmount,
        remaining_at_pickup: remainingAtPickup,
      },
    });
  } catch (error) {
    console.error('[Deposit Calc API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error calculating deposit', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
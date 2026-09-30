import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { computeDepositHeld } from '@/lib/escrow';

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
      select: { name: true, nameAr: true, pricePerDay: true, depositAmount: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, message_en: 'Product not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate total based on daily rate
    const totalAmount = product.pricePerDay * numberOfDays;

    // Sovereign trust system: explicit product deposit wins, else 30% of rental.
    // PHASE 2: same rule that governs the actual Chargily charge — one number,
    // one rule, everywhere (checkout route + webhook use computeDepositHeld).
    const depositPercentage = 30;
    const depositAmount = computeDepositHeld(product.depositAmount, totalAmount);
    const depositMode = (product.depositAmount ?? 0) > 0 ? 'PRODUCT_OVERRIDE' : 'SOVEREIGN_30';
    const remainingAtPickup = totalAmount - depositAmount;
    const totalCharged = Math.ceil(totalAmount) + depositAmount;

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        product_id: productId,
        product_name: product.nameAr || product.name,
        start_date: startDateStr,
        end_date: endDateStr,
        number_of_days: numberOfDays,
        daily_rate: product.pricePerDay,
        total_amount: Math.ceil(totalAmount),
        deposit_percentage: depositPercentage,
        deposit_amount: depositAmount,
        remaining_at_pickup: remainingAtPickup,
        // PHASE 2: fields the checkout UI already reads (breakdown lights up).
        total_charged: totalCharged,
        deposit_mode: depositMode,
        breakdown: {
          rental_fee: Math.ceil(totalAmount),
          security_deposit: depositAmount,
        },
      },
    });
  } catch (error) {
    logger.error('Deposit Calc API', 'Error', error);
    return NextResponse.json({ success: false, message_en: 'Error calculating deposit', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
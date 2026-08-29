// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Trust Score Sync Helper
// Recalculates trust score for a user and syncs to linked Vendor records
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { calculateTrustBreakdown, type TrustScoreBreakdown } from '@/lib/trust-score';

/**
 * Recalculate trust score for a user by userId, update User.trustScore
 * and sync to any linked Vendor records.
 * Returns the full breakdown for display.
 */
export async function recalcAndSyncTrustScore(userId: string): Promise<TrustScoreBreakdown> {
  // Fetch user basic info
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isVerified: true },
  });

  const emptyBreakdown: TrustScoreBreakdown = {
    verification: 0,
    rating: 0,
    vouches: 0,
    overall: 0,
    level: { tier: 'untrusted', label: 'غير موثوق', labelEn: 'Untrusted', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: '🔴' },
  };

  if (!user) return emptyBreakdown;

  // Fetch data for trust calculation in parallel
  const [vouchCount, userProducts] = await Promise.all([
    db.socialVouch.count({ where: { receiverId: userId } }),
    db.product.findMany({ where: { vendorId: userId }, select: { id: true } }),
  ]);

  const productIds = userProducts.map((p) => p.id);

  let avgRating = 0;
  let reviewCount = 0;

  if (productIds.length > 0) {
    const reviewStats = await db.review.aggregate({
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: true,
    });
    avgRating = reviewStats._avg.rating ?? 0;
    reviewCount = reviewStats._count;
  }

  const breakdown = calculateTrustBreakdown({
    isVerified: user.isVerified,
    avgRating,
    reviewCount,
    vouchCount,
  });

  // Update User.trustScore
  await db.user.update({
    where: { id: userId },
    data: { trustScore: breakdown.overall },
  }).catch(() => {});

  // Sync to linked Vendor records
  await db.vendor.updateMany({
    where: { userId },
    data: {
      trustScore: breakdown.overall,
      isVerified: user.isVerified,
    },
  }).catch(() => {});

  return breakdown;
}

/**
 * Recalculate trust score for a vendor (by vendorId) and update Vendor.trustScore.
 * Used when we only have a vendorId, not a userId.
 */
export async function recalcVendorTrustScore(vendorId: string): Promise<number> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, userId: true, isVerified: true },
  });
  if (!vendor) return 0;

  // If vendor has a linked user, use the full user-based calculation
  if (vendor.userId) {
    const breakdown = await recalcAndSyncTrustScore(vendor.userId);
    return breakdown.overall;
  }

  // Fallback: calculate based on vendor's own data
  const products = await db.product.findMany({
    where: { vendorId },
    select: { id: true },
  });

  const productIds = products.map((p) => p.id);
  let avgRating = 0;
  let reviewCount = 0;

  if (productIds.length > 0) {
    const reviewStats = await db.review.aggregate({
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: true,
    });
    avgRating = reviewStats._avg.rating ?? 0;
    reviewCount = reviewStats._count;
  }

  const breakdown = calculateTrustBreakdown({
    isVerified: vendor.isVerified,
    avgRating,
    reviewCount,
    vouchCount: 0,
  });

  await db.vendor.update({
    where: { id: vendorId },
    data: { trustScore: breakdown.overall },
  }).catch(() => {});

  return breakdown.overall;
}

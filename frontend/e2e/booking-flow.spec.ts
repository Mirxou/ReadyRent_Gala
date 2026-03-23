import { test, expect } from '@playwright/test';

test.describe('Booking Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/products/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-product',
          name: 'سيارة فاخرة موديل 2026',
          price_per_day: 1000,
          owner: { id: 'owner-1', name: 'أحمد شاهين', trust_score: 98 },
        }),
      });
    });

    await page.route('**/api/bookings/', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'booking-uuid-123' }),
      });
    });

    await page.route('**/api/payments/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'locked', amount: 1200 }),
      });
    });

    await page.goto('/products');
  });

  test('should complete a full booking flow with payment and signature', async ({ page }) => {
    // 1. Search & Select
    await page.getByPlaceholder('ابحث عن منتجات فاخرة...').fill('سيارة');
    await page.getByText('احجز الآن').click();

    // 2. Step 1: Dates
    await expect(page.getByText('حجز منتج فاخر')).toBeVisible();
    // Simulate date selection (simplified as we mock the store or use UI)
    await page.getByText('المتابعة').click();

    // 3. Step 2: Config
    await expect(page.getByText('التأمين الشامل للجالا')).toBeVisible();
    await page.getByText('المتابعة').click();

    // 4. Step 3: Verification
    await expect(page.getByText('درجة الموثوقية')).toBeVisible();
    await page.getByText('المتابعة').click();

    // 5. Step 4: Summary
    await expect(page.getByText('ملخص الحجز والتحصين المالي')).toBeVisible();
    await page.getByText('متابعة للدفع والتوقيع').click();

    // 6. Step 5: Payment & Signature
    await expect(page.getByText('تحصين الدفع وتوقيع العقد السيادي')).toBeVisible();
    
    // Fill payment info
    await page.getByPlaceholder('0000 0000 0000 0000').fill('4242424242424242');
    
    // Simulate signature (click/drag on canvas)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.up();
    }
    
    await page.getByText('تأكيد التوقيع').click();
    await page.getByText('اتمام العملية والتحصين').click();

    // 7. Success View
    await expect(page.getByText('تم تأكيد الحجز بنجاح!')).toBeVisible();
    await expect(page.getByText('BOOKING-UUID-123')).toBeVisible();
    
    // Celebratory sparkles check
    await expect(page.locator('canvas').nth(1)).toBeVisible(); // Confetti canvas
  });

  test('should show error if signature is missing', async ({ page }) => {
    await page.getByText('احجز الآن').click();
    // Skip to Step 5
    for (let i = 0; i < 4; i++) {
      await page.getByText('المتابعة').click();
    }
    
    const finishBtn = page.getByText('اتمام العملية والتحصين');
    await expect(finishBtn).toBeDisabled();
  });
});

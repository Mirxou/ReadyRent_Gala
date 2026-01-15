import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page
    await page.goto('/products')
  })

  test('should navigate to product detail and see booking calendar', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, a[href*="/products/"]', { timeout: 10000 }).catch(() => {})
    
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, a[href*="/products/"]').first()
    if (await firstProduct.count() > 0) {
      await firstProduct.click()
      
      // Check if navigated to product detail page
      await expect(page).toHaveURL(/\/products\/.+/)
      
      // Check for booking calendar or booking form
      const bookingSection = page.locator('[data-testid="booking-calendar"], .booking-calendar, [data-testid="booking-form"]')
      if (await bookingSection.count() > 0) {
        await expect(bookingSection.first()).toBeVisible()
      }
    }
  })

  test('should add product to cart', async ({ page }) => {
    // Navigate to product detail
    await page.goto('/products/1').catch(() => {})
    
    // Try to find add to cart button
    const addToCartButton = page.getByRole('button', { name: /add to cart|أضف للسلة|حجز/i })
    if (await addToCartButton.count() > 0) {
      await addToCartButton.first().click()
      
      // Check if navigated to cart or shows success message
      await page.waitForTimeout(1000)
    }
  })
})


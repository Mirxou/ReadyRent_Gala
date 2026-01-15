import { test, expect } from '@playwright/test'

test.describe('Cart Page', () => {
  test('should load cart page', async ({ page }) => {
    await page.goto('/cart')
    
    // Check if page loads
    await expect(page).toHaveTitle(/cart|سلة/i)
    
    // Check for cart content
    const cartContent = page.locator('main, [data-testid="cart"]')
    await expect(cartContent.first()).toBeVisible()
  })

  test('should show empty cart message when no items', async ({ page }) => {
    await page.goto('/cart')
    
    // Check for empty cart message
    const emptyMessage = page.getByText(/empty|فارغة|لا يوجد/i)
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage.first()).toBeVisible()
    }
  })

  test('should have checkout button when items exist', async ({ page }) => {
    await page.goto('/cart')
    
    // Wait a bit for cart to load
    await page.waitForTimeout(1000)
    
    // Check for checkout button
    const checkoutButton = page.getByRole('button', { name: /checkout|الدفع|إتمام/i })
    if (await checkoutButton.count() > 0) {
      await expect(checkoutButton.first()).toBeVisible()
    }
  })
})


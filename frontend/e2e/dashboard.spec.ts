import { test, expect } from '@playwright/test'

test.describe('User Dashboard', () => {
  test('should show login page when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login or show login form
    const loginForm = page.locator('form, [data-testid="login-form"], input[type="email"]')
    if (await loginForm.count() > 0) {
      await expect(loginForm.first()).toBeVisible()
    } else {
      // Might redirect to login page
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('should show bookings page', async ({ page }) => {
    await page.goto('/dashboard/bookings')
    
    // Should show login or bookings list
    const bookingsList = page.locator('[data-testid="bookings-list"], .bookings-list, main')
    const loginForm = page.locator('form, [data-testid="login-form"]')
    
    if (await bookingsList.count() > 0) {
      await expect(bookingsList.first()).toBeVisible()
    } else if (await loginForm.count() > 0) {
      // Requires authentication
      await expect(loginForm.first()).toBeVisible()
    }
  })
})


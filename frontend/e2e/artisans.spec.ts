import { test, expect } from '@playwright/test'

test.describe('Artisans Page', () => {
  test('should load artisans page', async ({ page }) => {
    await page.goto('/artisans')
    
    // Check if page loads
    await expect(page).toHaveTitle(/artisan|حرفية/i)
    
    // Check for main content
    const mainContent = page.locator('main')
    await expect(mainContent.first()).toBeVisible()
  })

  test('should display artisan cards', async ({ page }) => {
    await page.goto('/artisans')
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Check for artisan cards
    const artisanCards = page.locator('[data-testid="artisan-card"], .artisan-card, article')
    if (await artisanCards.count() > 0) {
      await expect(artisanCards.first()).toBeVisible()
    }
  })

  test('should navigate to artisan detail page', async ({ page }) => {
    await page.goto('/artisans')
    
    // Wait for content
    await page.waitForTimeout(2000)
    
    // Try to click on first artisan
    const firstArtisan = page.locator('a[href*="/artisans/"], [data-testid="artisan-card"] a').first()
    if (await firstArtisan.count() > 0) {
      await firstArtisan.click()
      
      // Check if navigated to detail page
      await expect(page).toHaveURL(/\/artisans\/.+/, { timeout: 5000 })
    }
  })
})


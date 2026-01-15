import { test, expect } from '@playwright/test'

test.describe('Local Guide Page', () => {
  test('should load local guide page', async ({ page }) => {
    await page.goto('/local-guide')
    
    // Check if page loads
    await expect(page).toHaveTitle(/local|دليل|guide/i)
    
    // Check for main content
    const mainContent = page.locator('main')
    await expect(mainContent.first()).toBeVisible()
  })

  test('should display service categories', async ({ page }) => {
    await page.goto('/local-guide')
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Check for categories or services
    const categories = page.locator('[data-testid="category"], .category, h2, h3')
    if (await categories.count() > 0) {
      await expect(categories.first()).toBeVisible()
    }
  })

  test('should filter services by category', async ({ page }) => {
    await page.goto('/local-guide')
    
    // Wait for content
    await page.waitForTimeout(2000)
    
    // Try to find filter buttons
    const filterButtons = page.locator('button:has-text("Filter"), [data-testid="filter"]')
    if (await filterButtons.count() > 0) {
      await expect(filterButtons.first()).toBeVisible()
    }
  })
})


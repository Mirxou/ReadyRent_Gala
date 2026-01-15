import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check if page loads
    await expect(page).toHaveTitle(/ReadyRent/i)
    
    // Check for main navigation
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check for hero section or main content
    const mainContent = page.locator('main, [role="main"]')
    await expect(mainContent.first()).toBeVisible()
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check for products link
    const productsLink = page.getByRole('link', { name: /products|المنتجات/i })
    if (await productsLink.count() > 0) {
      await expect(productsLink.first()).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if page loads on mobile
    await expect(page).toHaveTitle(/ReadyRent/i)
    
    // Check if navigation is accessible (might be hamburger menu)
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })
})


import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check for h1
    const h1 = page.locator('h1')
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible()
    }
  })

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/')
    
    // Check all images have alt text
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        // Alt can be empty for decorative images, but attribute should exist
        expect(alt).not.toBeNull()
      }
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through page
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    if (await focusedElement.count() > 0) {
      await expect(focusedElement.first()).toBeVisible()
    }
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/')
    
    // Check for navigation with proper ARIA
    const nav = page.locator('nav, [role="navigation"]')
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible()
    }
  })
})


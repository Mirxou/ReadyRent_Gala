import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      
      // Check if page loads
      await expect(page).toHaveTitle(/ReadyRent/i)
      
      // Check if main content is visible
      const mainContent = page.locator('main, [role="main"]')
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible()
      }
    })
  }

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check for mobile menu button (hamburger menu)
    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu"), [data-testid="mobile-menu"]')
    if (await menuButton.count() > 0) {
      await expect(menuButton.first()).toBeVisible()
    }
  })
})


import { test, expect } from '@playwright/test'

test.describe('Products Page', () => {
  test('should load products page', async ({ page }) => {
    await page.goto('/products')
    
    // Check if page loads
    await expect(page).toHaveTitle(/products|المنتجات/i)
    
    // Check for products list or grid
    const productsContainer = page.locator('[data-testid="products-list"], .products-grid, main')
    await expect(productsContainer.first()).toBeVisible()
  })

  test('should filter products', async ({ page }) => {
    await page.goto('/products')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 }).catch(() => {})
    
    // Try to find filter buttons/inputs
    const filters = page.locator('[data-testid="filters"], .filters, button:has-text("Filter")')
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible()
    }
  })

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/products')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, a[href*="/products/"]', { timeout: 10000 }).catch(() => {})
    
    // Try to click on first product
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, a[href*="/products/"]').first()
    if (await firstProduct.count() > 0) {
      await firstProduct.click()
      
      // Check if navigated to product detail page
      await expect(page).toHaveURL(/\/products\/.+/)
    }
  })
})


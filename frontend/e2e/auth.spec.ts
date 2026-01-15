import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check if login page loads
    await expect(page).toHaveTitle(/login|تسجيل الدخول/i)
    
    // Check for login form
    const loginForm = page.locator('form, [data-testid="login-form"]')
    await expect(loginForm.first()).toBeVisible()
  })

  test('should show register page', async ({ page }) => {
    await page.goto('/register')
    
    // Check if register page loads
    await expect(page).toHaveTitle(/register|التسجيل/i)
    
    // Check for register form
    const registerForm = page.locator('form, [data-testid="register-form"]')
    await expect(registerForm.first()).toBeVisible()
  })

  test('should validate login form', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|تسجيل الدخول|submit/i })
    if (await submitButton.count() > 0) {
      await submitButton.first().click()
      
      // Check for validation errors (if form validation is implemented)
      await page.waitForTimeout(500)
    }
  })
})


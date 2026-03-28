import { test, expect } from '@playwright/test';

test.describe('Judicial System Validation', () => {
  test('should load the public judicial ledger and display stats', async ({ page }) => {
    // Navigate to Judicial Ledger
    await page.goto('/judicial');
    
    // Verify the page title and hero 
    await expect(page).toHaveTitle(/STANDARD|السجل القضائي/i);
    await expect(page.getByText('السجل القضائي العام')).toBeVisible();

    // Verify search input is present
    const searchInput = page.getByPlaceholder(/بحث/i);
    await expect(searchInput).toBeVisible();

    // Verify filter dropdowns are present
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible();
  });

  test('should display AI Assistant on disputes page', async ({ page }) => {
    await page.goto('/disputes');
    
    // Verify the floating AI assistant button is present (represented by lucide-react scale/bot icon)
    // We target the floating button by checking for its core attributes or title
    const aiButton = page.locator('button[title="المساعد القضائي"]');
    await expect(aiButton).toBeVisible();
    
    // Click to open panel
    await aiButton.click();
    
    // Verify the panel opens and shows the AI header
    await expect(page.getByText('مدعوم بالذكاء الاصطناعي')).toBeVisible();
  });

  test('should load contract timeline correctly', async ({ page }) => {
    // Assuming there is a contract with ID 100 for testing, or we mock it.
    // In a real E2E environment without mocked DB, this might redirect or show 404.
    // We will verify the structural integrity of the timeline component assuming it renders.
    
    // Route interception to mock the contract response
    await page.route('**/api/contracts/contracts/100/', async route => {
      const json = {
        id: 100,
        booking_id: 200,
        status: 'signed',
        is_finalized: false,
        contract_hash: 'abc123hash',
        parties: [],
        snapshot: {
          renter_signed_at: new Date().toISOString()
        }
      };
      await route.fulfill({ json });
    });

    await page.goto('/contracts/100');
    
    // Verify timeline UI structure
    await expect(page.getByText('مسار العقد الزمني')).toBeVisible();
    await expect(page.getByText('إنشاء العقد')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Sportsbook', () => {
  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/sportsbook');
    // Since we are unauthenticated, we expect the login modal or page to show up.
    await expect(page.locator('text=Login').first()).toBeVisible();
  });

  // To test authenticated pages in Playwright, we would either 
  // setup global auth state or mock the Supabase session.
  // For now, ensuring the page exists and redirects is enough for coverage.
});

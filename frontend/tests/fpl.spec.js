import { test, expect } from '@playwright/test';

test.describe('FPL Dashboard', () => {
  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/fpl');
    await expect(page.locator('text=Login').first()).toBeVisible();
  });
});

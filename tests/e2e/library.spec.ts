import { test, expect } from '@playwright/test';

test('library search', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

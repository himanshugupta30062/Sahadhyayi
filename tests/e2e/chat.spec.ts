import { test, expect } from '@playwright/test';

test('chat renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

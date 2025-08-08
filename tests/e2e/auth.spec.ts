import { test, expect } from '@playwright/test';

test('auth flow', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sahadhyayi/);
});

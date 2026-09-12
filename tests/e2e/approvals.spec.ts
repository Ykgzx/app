import { test, expect } from '@playwright/test';

test.describe('Approvals Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Approver
    await page.goto('/login');
    await page.fill('input[type="text"]', 'approver@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('TC-APP-01: View pending approvals', async ({ page }) => {
    await page.click('text=การอนุมัติคำขอ');
    await expect(page).toHaveURL('/approvals');

    // Check if table exists
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=รออนุมัติ').first()).toBeVisible();
  });
});

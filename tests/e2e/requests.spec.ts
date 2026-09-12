import { test, expect } from '@playwright/test';

test.describe('Requests Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Staff
    await page.goto('/login');
    await page.fill('input[type="text"]', 'staff@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('TC-REQ-01: Create material request', async ({ page }) => {
    await page.click('text=ส่งคำขอเบิก–ยืม');
    await expect(page).toHaveURL('/requests');

    // Click create button
    await page.click('text=ส่งคำขอเบิกวัสดุ');

    // Select material from the list (using the first one available)
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 });

    // Fill quantity and reason
    await page.fill('input[type="number"]', '1');
    await page.fill('textarea', 'Automated testing request');

    // Submit
    await page.click('button:has-text("ยืนยันส่งคำขอ")');

    // Wait for the modal to close (or wait a bit)
    await page.waitForTimeout(2000);
    
    // Check if it appears in the list
    await expect(page.locator('text=Automated testing request').first()).toBeVisible();
  });
});

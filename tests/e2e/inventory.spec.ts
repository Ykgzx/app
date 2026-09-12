import { test, expect } from '@playwright/test';

test.describe('Inventory Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('TC-INV-01: View inventory list', async ({ page }) => {
    await page.click('text=คลังวัสดุ');
    await expect(page).toHaveURL('/inventory');
    
    // Check if table exists
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'รหัส' }).first()).toBeVisible();
    await expect(page.locator('th', { hasText: 'ชื่อวัสดุ / ครุภัณฑ์' }).first()).toBeVisible();
  });

  test('TC-INV-02: Search materials', async ({ page }) => {
    await page.goto('/inventory');
    
    // Type in search box
    await page.fill('input[placeholder="ค้นหาตามชื่อวัสดุ, รหัส, หรือที่เก็บ..."]', 'กระดาษ');
    
    // Check if results update
    // We assume there's a material with 'กระดาษ' in the seed data
    await expect(page.locator('table').locator('text=กระดาษ').first()).toBeVisible();
  });
});

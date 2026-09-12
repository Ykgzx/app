import { test, expect } from '@playwright/test';

test.describe('Authentication Module', () => {
  test('TC-AUTH-01: Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Test Staff Login
    await page.fill('input[type="text"]', 'staff@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/');
    
    // Check if user name is displayed
    await expect(page.locator('text=ยินดีต้อนรับคุณ')).toBeVisible();
    await expect(page.locator('text=วันทนา สุขกมล').first()).toBeVisible();
  });

  test('TC-AUTH-02: Login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="text"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Expect an error message
    await expect(page.locator('text=อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง')).toBeVisible();
  });

  test('TC-AUTH-03: Admin RBAC Test', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Go to users page
    await page.click('text=จัดการผู้ใช้งาน');
    await expect(page).toHaveURL('/users');
    await expect(page.locator('h1:has-text("จัดการผู้ใช้งานและสิทธิ์การเข้าถึง")')).toBeVisible();
  });

  test('TC-AUTH-04: Approver RBAC Test', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'approver@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Try to go to users page directly
    await page.goto('/users');
    // Expect Access Denied
    await expect(page.locator('text=ไม่มีสิทธิ์เข้าถึง')).toBeVisible();
  });
});

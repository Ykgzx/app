import { test, expect } from '@playwright/test';

test.describe('Users Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@rangsit.go.th');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await page.goto('/users');
  });

  test('TC-USER-01: Create new user with password', async ({ page }) => {
    // Click "เพิ่มผู้ใช้งานใหม่"
    await page.click('button:has-text("เพิ่มผู้ใช้งานใหม่")');

    // Fill the form
    await page.fill('input[placeholder="เช่น สมชาย ใจดี"]', 'Automated Test User');
    const randomSuffix = Math.floor(Math.random() * 10000);
    const newUsername = `testuser${randomSuffix}`;
    await page.fill('input[placeholder="เช่น somchai.j"]', newUsername);
    await page.fill('input[type="password"]', 'newsecurepass123');
    await page.fill('input[type="email"]', `testuser${randomSuffix}@rangsit.go.th`);
    await page.fill('input[type="tel"]', '0812345678');
    
    // Select role (เจ้าหน้าที่ - Default)
    
    // Save
    await page.click('button:has-text("บันทึกข้อมูล")');

    // Wait a bit instead of asserting toast just in case it disappears fast
    await page.waitForTimeout(2000);

    // The new user should appear in the table
    await expect(page.locator(`text=${newUsername}`)).toBeVisible();
  });

  test('TC-USER-02: Edit existing user and change password', async ({ page }) => {
    // Find the edit button for a staff user. We can search for the "staff" username.
    await page.fill('input[placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, อีเมล, หรือแผนก..."]', 'staff');
    
    // Click the first edit button (Pencil icon) in the table
    await page.click('button[title="แก้ไขข้อมูลผู้ใช้"] >> nth=0');

    // Change the password
    await page.fill('input[type="password"]', 'changedpassword123');

    // Save
    await page.click('button:has-text("บันทึกข้อมูล")');

    // Wait a bit
    await page.waitForTimeout(2000);
  });
});

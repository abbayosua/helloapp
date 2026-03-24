import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('should show login form by default', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should switch to register form', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/display name/i)).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    // HTML5 validation should prevent form submission
    await expect(page.getByLabel(/email/i)).toBeFocused();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('nonexistent@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should show register form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByLabel(/display name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password456');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.getByLabel(/display name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('123');
    await page.getByLabel(/confirm password/i).fill('123');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });
});

test.describe('Home Page (Authenticated)', () => {
  test.skip('should show chat interface after login', async ({ page }) => {
    // This test requires a registered user
    // Skip for now until we have test fixtures
  });
});

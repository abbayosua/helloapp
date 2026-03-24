import { test as base, Page, BrowserContext } from '@playwright/test';

// Test user types
export interface TestUser {
  email: string;
  password: string;
  display_name: string;
  phone: string;
  id?: string;
}

// Generate unique test user
export function generateTestUser(prefix: string = 'test'): TestUser {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `${prefix}_${timestamp}_${random}@test.com`,
    password: 'Test123456!',
    display_name: `Test ${prefix}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  };
}

// Register a new user via API
export async function registerUser(page: Page, user: TestUser): Promise<{ success: boolean; id?: string; error?: string }> {
  const response = await page.request.post('/api/auth/register', {
    data: {
      email: user.email,
      password: user.password,
      display_name: user.display_name,
      phone: user.phone,
    },
  });

  const data = await response.json();
  
  if (response.ok && data.success) {
    return { success: true, id: data.user?.id };
  }
  
  return { success: false, error: data.error };
}

// Login user via API and store session
export async function loginUser(page: Page, user: TestUser): Promise<{ success: boolean; error?: string }> {
  const response = await page.request.post('/api/auth/login', {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  const data = await response.json();
  
  if (response.ok && data.success) {
    return { success: true };
  }
  
  return { success: false, error: data.error };
}

// Register and login user (full flow)
export async function registerAndLogin(page: Page, user: TestUser): Promise<{ success: boolean; id?: string; error?: string }> {
  // Register the user
  const registerResult = await registerUser(page, user);
  
  if (!registerResult.success) {
    return registerResult;
  }
  
  // Login via API to get session cookie
  const loginResponse = await page.request.post('/api/auth/login', {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  if (!loginResponse.ok) {
    const data = await loginResponse.json();
    return { success: false, error: data.error };
  }
  
  // Navigate to home to establish session
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  return { success: true, id: registerResult.id };
}

// Extended test fixture with auth helpers
export const test = base.extend<{
  authenticatedPage: Page;
  testUser: TestUser;
}>({
  // Provide a test user
  // eslint-disable-next-line react-hooks/rules-of-hooks
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
  },
  
  // Provide an authenticated page
  // eslint-disable-next-line react-hooks/rules-of-hooks
  authenticatedPage: async ({ page }, use) => {
    const user = generateTestUser('auth');
    
    // Register user
    await registerUser(page, user);
    
    // Login via page UI (more realistic)
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect to home
    await page.waitForURL('/', { timeout: 15000 });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

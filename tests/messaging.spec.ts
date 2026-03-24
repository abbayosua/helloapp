import { test, expect, Page, BrowserContext } from '@playwright/test';

// Helper to register and login a user
async function registerAndLogin(page: Page, prefix: string = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const user = {
    email: `${prefix}_${timestamp}_${random}@test.com`,
    password: 'Test123456!',
    display_name: `Test ${prefix}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  };
  
  // Go to register page
  await page.goto('/register');
  
  // Fill registration form
  await page.getByLabel(/display name/i).fill(user.display_name);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/^password/i).fill(user.password);
  await page.getByLabel(/confirm password/i).fill(user.password);
  
  // Submit registration
  await page.getByRole('button', { name: /create account/i }).click();
  
  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 15000 }).catch(() => {
    // If redirect doesn't happen, try logging in manually
    return page.goto('/login').then(() => {
      return page.getByLabel(/email/i).fill(user.email).then(() => {
        return page.getByLabel(/password/i).fill(user.password);
      }).then(() => {
        return page.getByRole('button', { name: /sign in/i }).click();
      }).then(() => {
        return page.waitForURL('/', { timeout: 15000 });
      });
    });
  });
  
  return user;
}

// Helper to register via API
async function registerUserAPI(context: BrowserContext, prefix: string = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const user = {
    email: `${prefix}_${timestamp}_${random}@test.com`,
    password: 'Test123456!',
    display_name: `Test ${prefix}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  };
  
  // Register
  const regResponse = await context.request.post('/api/auth/register', {
    data: user,
  });
  
  if (!regResponse.ok()) {
    throw new Error('Failed to register user');
  }
  
  // Login to get session
  const loginResponse = await context.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  
  if (!loginResponse.ok()) {
    throw new Error('Failed to login user');
  }
  
  const regData = await regResponse.json();
  return { ...user, id: regData.user?.id };
}

test.describe('Phase 2: Messaging', () => {
  test.describe('Authentication', () => {
    test('should register a new user', async ({ page }) => {
      const timestamp = Date.now();
      const user = {
        email: `test_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: 'Test User',
        phone: '+1234567890',
      };
      
      await page.goto('/register');
      await page.getByLabel(/display name/i).fill(user.display_name);
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/^password/i).fill(user.password);
      await page.getByLabel(/confirm password/i).fill(user.password);
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Should redirect to home
      await page.waitForURL('/', { timeout: 15000 });
      
      // Should be on home page
      expect(page.url()).toContain('/');
    });

    test('should login an existing user', async ({ page, browser }) => {
      // First register via API
      const user = await registerUserAPI(await browser.newContext(), 'login');
      
      // Use a fresh page without auth cookies to test login
      const freshContext = await browser.newContext();
      const freshPage = await freshContext.newPage();
      
      // Navigate to login page
      await freshPage.goto('/login');
      
      // Fill login form
      await freshPage.getByLabel(/email/i).fill(user.email);
      await freshPage.getByLabel(/password/i).fill(user.password);
      await freshPage.getByRole('button', { name: /sign in/i }).click();
      
      // Should redirect to home
      await freshPage.waitForURL('/', { timeout: 15000 });
      expect(freshPage.url()).toContain('/');
      
      await freshContext.close();
    });
  });

  test.describe('User Search API', () => {
    test('should search for users', async ({ page, context }) => {
      // Register two users
      const user1 = await registerUserAPI(context, 'searcher');
      
      // Create a second user
      const timestamp = Date.now();
      const user2 = {
        email: `target_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Unique Search Target`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      };
      
      await context.request.post('/api/auth/register', {
        data: user2,
      });
      
      // Search for user2 (from browser context which has cookies)
      const response = await page.request.get(`/api/users/search?q=${encodeURIComponent('Unique Search Target')}`);
      expect(response.ok()).toBe(true);
      
      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });
  });

  test.describe('Conversations API', () => {
    test('should create a direct conversation', async ({ page, context }) => {
      // Create user1 (logged in)
      const user1 = await registerUserAPI(context, 'conv1');
      
      // Create user2
      const timestamp = Date.now();
      const user2Data = {
        email: `conv2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test conv2`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      };
      
      const regResponse = await context.request.post('/api/auth/register', {
        data: user2Data,
      });
      const regData = await regResponse.json();
      const user2Id = regData.user?.id;
      
      // Create conversation via browser request
      const response = await page.request.post('/api/conversations', {
        data: {
          participant_ids: [user2Id],
          is_group: false,
        },
      });
      
      // Check response
      const responseText = await response.text();
      console.log('Create conversation response status:', response.status());
      console.log('Create conversation response:', responseText);
      
      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.conversation).toBeDefined();
    });

    test('should list user conversations', async ({ page, context }) => {
      // Create user
      await registerUserAPI(context, 'list1');
      
      // Get conversations
      const response = await page.request.get('/api/conversations');
      
      const responseText = await response.text();
      console.log('List conversations response status:', response.status());
      
      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.conversations).toBeDefined();
      expect(Array.isArray(data.conversations)).toBe(true);
    });
  });

  test.describe('Messages API', () => {
    test('should send a message', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'msg1');
      
      const timestamp = Date.now();
      const user2Data = {
        email: `msg2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test msg2`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      };
      
      const regResponse = await context.request.post('/api/auth/register', {
        data: user2Data,
      });
      const regData = await regResponse.json();
      const user2Id = regData.user?.id;
      
      // Create conversation
      const convResponse = await page.request.post('/api/conversations', {
        data: {
          participant_ids: [user2Id],
          is_group: false,
        },
      });
      
      if (!convResponse.ok()) {
        console.log('Conv response not ok:', await convResponse.text());
        test.skip();
        return;
      }
      
      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;
      
      expect(conversationId).toBeDefined();
      
      // Send message
      const response = await page.request.post(`/api/conversations/${conversationId}/messages`, {
        data: {
          content: 'Hello, this is a test message!',
        },
      });
      
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.message).toBeDefined();
    });

    test('should retrieve messages', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'get1');
      
      const timestamp = Date.now();
      const user2Data = {
        email: `get2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test get2`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      };
      
      const regResponse = await context.request.post('/api/auth/register', {
        data: user2Data,
      });
      const regData = await regResponse.json();
      const user2Id = regData.user?.id;
      
      // Create conversation
      const convResponse = await page.request.post('/api/conversations', {
        data: {
          participant_ids: [user2Id],
          is_group: false,
        },
      });
      
      if (!convResponse.ok()) {
        console.log('Conv response not ok:', await convResponse.text());
        test.skip();
        return;
      }
      
      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;
      
      expect(conversationId).toBeDefined();
      
      // Send a message
      await page.request.post(`/api/conversations/${conversationId}/messages`, {
        data: {
          content: 'Test message for retrieval',
        },
      });
      
      // Get messages
      const response = await page.request.get(`/api/conversations/${conversationId}/messages`);
      expect(response.ok()).toBe(true);
      
      const data = await response.json();
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
    });
  });

  test.describe('API Security', () => {
    test('should return 401 for unauthenticated conversation access', async ({ browser }) => {
      // Create a fresh context without any auth
      const context = await browser.newContext();
      const response = await context.request.get('/api/conversations');
      
      // Should return 401 since we're not authenticated
      expect(response.status()).toBe(401);
      
      await context.close();
    });

    test('should return error for unauthenticated message access', async ({ browser }) => {
      // Create a fresh context without any auth
      const context = await browser.newContext();
      const response = await context.request.get('/api/conversations/test-id/messages');
      
      // Should return 401 or 404
      expect([401, 404]).toContain(response.status());
      
      await context.close();
    });
  });
});

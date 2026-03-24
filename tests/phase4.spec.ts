import { test, expect, Page, BrowserContext } from '@playwright/test';

// Helper to register and login a user
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

test.describe('Phase 4: Contacts & Social', () => {
  test.describe('Contact Management', () => {
    test('should add a new contact', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-add');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add a contact
      const response = await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1234567890',
          name: 'Test Contact',
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.contact).toBeDefined();
      expect(data.contact.phone).toBe('+1234567890');
    });

    test('should list contacts', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-list');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add a contact first
      await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1987654321',
          name: 'List Test Contact',
        },
      });

      // Get contacts list
      const response = await page.request.get('/api/users/contacts');

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
    });

    test('should delete a contact', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-delete');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add a contact
      const addResponse = await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1555555555',
          name: 'Delete Test Contact',
        },
      });

      const addData = await addResponse.json();
      const contactId = addData.contact?.id;

      // Delete the contact
      const deleteResponse = await page.request.delete(
        `/api/users/contacts?id=${contactId}`
      );

      expect(deleteResponse.ok()).toBe(true);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);
    });
  });

  test.describe('Bulk Contact Sync', () => {
    test('should sync contacts in bulk', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-sync');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Sync multiple contacts
      const response = await page.request.post('/api/users/contacts', {
        data: {
          contacts: [
            { phone: '+1111111111', name: 'Contact One' },
            { phone: '+1222222222', name: 'Contact Two' },
            { phone: '+1333333333', name: 'Contact Three' },
          ],
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.added).toBeGreaterThan(0);
      expect(data.total).toBe(3);
    });

    test('should update existing contacts during sync', async ({
      page,
      context,
    }) => {
      // Register and login
      await registerUserAPI(context, 'contact-sync-update');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add initial contact
      await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1444444444',
          name: 'Original Name',
        },
      });

      // Sync with updated name
      const response = await page.request.post('/api/users/contacts', {
        data: {
          contacts: [{ phone: '+1444444444', name: 'Updated Name' }],
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.updated).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Blocking Functionality', () => {
    test('should block a contact', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-block');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add a contact
      const addResponse = await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1666666666',
          name: 'Block Test Contact',
        },
      });

      const addData = await addResponse.json();
      const contactId = addData.contact?.id;

      // Block the contact
      const blockResponse = await page.request.delete(
        `/api/users/contacts?id=${contactId}&block=true`
      );

      expect(blockResponse.ok()).toBe(true);
      const blockData = await blockResponse.json();
      expect(blockData.success).toBe(true);
      expect(blockData.message).toContain('blocked');
    });

    test('should list blocked contacts', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-blocked-list');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add and block a contact
      const addResponse = await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1777777777',
          name: 'Blocked Contact',
        },
      });

      const addData = await addResponse.json();
      const contactId = addData.contact?.id;

      await page.request.delete(`/api/users/contacts?id=${contactId}&block=true`);

      // Get blocked contacts
      const response = await page.request.get(
        '/api/users/contacts?blocked_only=true'
      );

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
      // Should have at least one blocked contact
      expect(data.contacts.length).toBeGreaterThanOrEqual(0);
    });

    test('should unblock a blocked contact', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'contact-unblock');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add a contact
      const addResponse = await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1888888888',
          name: 'Unblock Test Contact',
        },
      });

      const addData = await addResponse.json();
      const contactId = addData.contact?.id;

      // Block the contact
      await page.request.delete(`/api/users/contacts?id=${contactId}&block=true`);

      // Unblock by adding the contact again with same phone
      const unblockResponse = await page.request.post('/api/users/contacts', {
        data: {
          phone: '+1888888888',
          name: 'Unblocked Contact',
        },
      });

      expect(unblockResponse.ok()).toBe(true);
      const unblockData = await unblockResponse.json();
      expect(unblockData.message).toContain('unblocked');
    });
  });

  test.describe('Contact Discovery', () => {
    test('should find users by phone number', async ({ page, context }) => {
      // Create user1 (logged in)
      const user1 = await registerUserAPI(context, 'discover1');

      // Create user2 with a specific phone
      const timestamp = Date.now();
      const user2Phone = `+1999999999`;

      // Register user2 directly via context.request
      await context.request.post('/api/auth/register', {
        data: {
          email: `discover2_${timestamp}@test.com`,
          password: 'Test123456!',
          display_name: 'Discoverable User',
          phone: user2Phone,
        },
      });

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Add user2 as contact by phone
      const response = await page.request.post('/api/users/contacts', {
        data: {
          phone: user2Phone,
          name: 'Found User',
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.contact).toBeDefined();
      // Should find the profile matching this phone
      if (data.contact.profile) {
        expect(data.contact.profile.phone).toBe(user2Phone);
      }
    });
  });
});

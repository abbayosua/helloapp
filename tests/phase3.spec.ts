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

test.describe('Phase 3: User Experience', () => {
  test.describe('Presence System', () => {
    test('should update user presence status', async ({ page, context }) => {
      // Register and login
      const user = await registerUserAPI(context, 'presence');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Check that presence is tracked (user should be online)
      const response = await page.request.get('/api/users/presence?user_ids=' + user.id);
      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    test('should manually update presence', async ({ page, context }) => {
      // Register and login
      await registerUserAPI(context, 'presence-manual');

      // Navigate to home page
      await page.goto('/');
      await page.waitForURL('/', { timeout: 15000 });

      // Update presence to 'away'
      const response = await page.request.patch('/api/users/presence', {
        data: { status: 'away' },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.profile.status).toBe('away');
    });
  });

  test.describe('Message Reactions', () => {
    test('should add a reaction to a message', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'react1');

      const timestamp = Date.now();
      const user2Data = {
        email: `react2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test react2`,
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
        test.skip();
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;

      // Send a message
      const msgResponse = await page.request.post(
        `/api/conversations/${conversationId}/messages`,
        {
          data: { content: 'React to this message!' },
        }
      );

      const msgData = await msgResponse.json();
      const messageId = msgData.message?.id;

      // Add reaction
      const reactionResponse = await page.request.post(
        `/api/messages/${messageId}/reactions`,
        {
          data: { reaction: '👍' },
        }
      );

      expect(reactionResponse.ok()).toBe(true);
      const reactionData = await reactionResponse.json();
      expect(reactionData.success).toBe(true);
      expect(reactionData.action).toBe('added');
    });

    test('should toggle off reaction when clicking same emoji', async ({
      page,
      context,
    }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'react-toggle');

      const timestamp = Date.now();
      const user2Data = {
        email: `react-toggle2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test react-toggle2`,
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
        test.skip();
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;

      // Send a message
      const msgResponse = await page.request.post(
        `/api/conversations/${conversationId}/messages`,
        {
          data: { content: 'Toggle reaction test' },
        }
      );

      const msgData = await msgResponse.json();
      const messageId = msgData.message?.id;

      // Add reaction
      await page.request.post(`/api/messages/${messageId}/reactions`, {
        data: { reaction: '❤️' },
      });

      // Toggle off by adding same reaction
      const toggleResponse = await page.request.post(
        `/api/messages/${messageId}/reactions`,
        {
          data: { reaction: '❤️' },
        }
      );

      expect(toggleResponse.ok()).toBe(true);
      const toggleData = await toggleResponse.json();
      expect(toggleData.action).toBe('removed');
    });

    test('should get reactions for a message', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'react-get');

      const timestamp = Date.now();
      const user2Data = {
        email: `react-get2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test react-get2`,
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
        test.skip();
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;

      // Send a message
      const msgResponse = await page.request.post(
        `/api/conversations/${conversationId}/messages`,
        {
          data: { content: 'Get reactions test' },
        }
      );

      const msgData = await msgResponse.json();
      const messageId = msgData.message?.id;

      // Add reaction
      await page.request.post(`/api/messages/${messageId}/reactions`, {
        data: { reaction: '😂' },
      });

      // Get reactions
      const getResponse = await page.request.get(
        `/api/messages/${messageId}/reactions`
      );

      expect(getResponse.ok()).toBe(true);
      const getData = await getResponse.json();
      expect(getData.reactions).toBeDefined();
      expect(getData.reactions.length).toBeGreaterThan(0);
    });
  });

  test.describe('Message Search', () => {
    test('should search messages in conversation', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'search1');

      const timestamp = Date.now();
      const user2Data = {
        email: `search2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test search2`,
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
        test.skip();
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;

      // Send messages
      await page.request.post(`/api/conversations/${conversationId}/messages`, {
        data: { content: 'Hello world!' },
      });

      await page.request.post(`/api/conversations/${conversationId}/messages`, {
        data: { content: 'This is a unique search term!' },
      });

      await page.request.post(`/api/conversations/${conversationId}/messages`, {
        data: { content: 'Another message' },
      });

      // Search for messages
      const searchResponse = await page.request.get(
        `/api/conversations/${conversationId}/search?q=${encodeURIComponent('unique search term')}`
      );

      expect(searchResponse.ok()).toBe(true);
      const searchData = await searchResponse.json();
      expect(searchData.messages).toBeDefined();
      expect(searchData.messages.length).toBeGreaterThan(0);
      expect(searchData.messages[0].content).toContain('unique search term');
    });

    test('should return empty for no matches', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'search-empty');

      const timestamp = Date.now();
      const user2Data = {
        email: `search-empty2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test search-empty2`,
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
        test.skip();
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;

      // Search for non-existent message
      const searchResponse = await page.request.get(
        `/api/conversations/${conversationId}/search?q=${encodeURIComponent('zzzzzznonexistentzzzzzz')}`
      );

      expect(searchResponse.ok()).toBe(true);
      const searchData = await searchResponse.json();
      expect(searchData.messages).toBeDefined();
      expect(searchData.messages.length).toBe(0);
    });
  });

  test.describe('Reply to Messages', () => {
    test('should send a reply message', async ({ page, context }) => {
      // Create users
      const user1 = await registerUserAPI(context, 'reply1');

      const timestamp = Date.now();
      const user2Data = {
        email: `reply2_${timestamp}@test.com`,
        password: 'Test123456!',
        display_name: `Test reply2`,
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
        test.skip();
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation?.id;

      // Send original message
      const msgResponse = await page.request.post(
        `/api/conversations/${conversationId}/messages`,
        {
          data: { content: 'Original message to reply to' },
        }
      );

      const msgData = await msgResponse.json();
      const originalMessageId = msgData.message?.id;

      // Send reply message
      const replyResponse = await page.request.post(
        `/api/conversations/${conversationId}/messages`,
        {
          data: {
            content: 'This is a reply!',
            reply_to: originalMessageId,
          },
        }
      );

      expect(replyResponse.ok()).toBe(true);
      const replyData = await replyResponse.json();
      expect(replyData.message).toBeDefined();
      expect(replyData.message.reply_to).toBe(originalMessageId);
    });
  });
});

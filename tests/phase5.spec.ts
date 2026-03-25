import { test, expect, BrowserContext } from '@playwright/test';

// Helper to register and login a user via API
async function registerAndLoginAPI(context: BrowserContext, prefix: string = 'test') {
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

// Helper to create additional users
async function createUser(context: BrowserContext, prefix: string = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const user = {
    email: `${prefix}_${timestamp}_${random}@test.com`,
    password: 'Test123456!',
    display_name: `Test ${prefix}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  };
  
  const regResponse = await context.request.post('/api/auth/register', { data: user });
  const regData = await regResponse.json();
  return { ...user, id: regData.user?.id };
}

test.describe('Phase 5: Group Chats', () => {
  test.describe('Group Creation', () => {
    test('should create a group conversation', async ({ context }) => {
      // Create user1 (logged in)
      await registerAndLoginAPI(context, 'group1');
      
      // Create user2 and user3
      const user2 = await createUser(context, 'group2');
      const user3 = await createUser(context, 'group3');

      const response = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Test Group',
          description: 'A test group for Phase 5',
          participant_ids: [user2.id, user3.id],
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.conversation).toBeDefined();
      expect(data.conversation.type).toBe('group');
      expect(data.is_new).toBe(true);
      expect(data.conversation.participants.length).toBe(3);
    });

    test('should require group name for group conversations', async ({ context }) => {
      // Create user1 (logged in)
      await registerAndLoginAPI(context, 'noname1');
      
      // Create user2 and user3
      const user2 = await createUser(context, 'noname2');
      const user3 = await createUser(context, 'noname3');

      const response = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          participant_ids: [user2.id, user3.id],
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Group name is required');
    });

    test('should require at least 3 participants for group', async ({ context }) => {
      // Create user1 (logged in)
      await registerAndLoginAPI(context, 'small1');
      
      // Create user2
      const user2 = await createUser(context, 'small2');

      const response = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Small Group',
          participant_ids: [user2.id],
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('at least 3 participants');
    });
  });

  test.describe('Group Management', () => {
    test('should get group details', async ({ context }) => {
      // Create users and group in the same test
      await registerAndLoginAPI(context, 'detail1');
      const user2 = await createUser(context, 'detail2');
      const user3 = await createUser(context, 'detail3');
      
      // Create a group
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Detail Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      console.log('Create response:', JSON.stringify(createData, null, 2));
      
      const groupId = createData.conversation?.id;
      expect(groupId).toBeDefined();

      const response = await context.request.get(`/api/groups/${groupId}`);
      console.log('Get group response status:', response.status());
      const responseText = await response.text();
      console.log('Get group response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.group).toBeDefined();
      expect(data.group.name).toBe('Detail Test Group');
      expect(data.group.participants).toBeDefined();
    });

    test('should update group settings', async ({ context }) => {
      // Create users and group
      await registerAndLoginAPI(context, 'update1');
      const user2 = await createUser(context, 'update2');
      const user3 = await createUser(context, 'update3');
      
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Update Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      const groupId = createData.conversation?.id;

      const response = await context.request.patch(`/api/groups/${groupId}`, {
        data: {
          name: 'Updated Group Name',
          description: 'Updated description',
        },
      });

      console.log('Update response status:', response.status());
      const responseText = await response.text();
      console.log('Update response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.group.name).toBe('Updated Group Name');
    });

    test('should generate invite link', async ({ context }) => {
      // Create users and group
      await registerAndLoginAPI(context, 'invite1');
      const user2 = await createUser(context, 'invite2');
      const user3 = await createUser(context, 'invite3');
      
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Invite Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      const groupId = createData.conversation?.id;

      const response = await context.request.post(`/api/groups/${groupId}/invite`);
      console.log('Generate invite response status:', response.status());
      const responseText = await response.text();
      console.log('Generate invite response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.invite_link).toBeDefined();
    });
  });

  test.describe('Group Admins', () => {
    test('should list group admins', async ({ context }) => {
      // Create users and group
      await registerAndLoginAPI(context, 'admin1');
      const user2 = await createUser(context, 'admin2');
      const user3 = await createUser(context, 'admin3');
      
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Admin Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      const groupId = createData.conversation?.id;

      const response = await context.request.get(`/api/groups/${groupId}/admins`);
      console.log('List admins response status:', response.status());
      const responseText = await response.text();
      console.log('List admins response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.admins).toBeDefined();
      expect(Array.isArray(data.admins)).toBe(true);
    });

    test('should promote member to admin', async ({ context }) => {
      // Create users and group
      await registerAndLoginAPI(context, 'promote1');
      const user2 = await createUser(context, 'promote2');
      const user3 = await createUser(context, 'promote3');
      
      console.log('Created users:', { user2Id: user2.id, user3Id: user3.id });
      
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Promote Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      console.log('Create group response:', JSON.stringify(createData, null, 2));
      const groupId = createData.conversation?.id;
      
      console.log('Group ID:', groupId);
      console.log('Group participants:', createData.conversation?.participants?.map((p: { id: string }) => p.id));

      // First verify user2 is in the group by getting details
      const detailResponse = await context.request.get(`/api/groups/${groupId}`);
      const detailData = await detailResponse.json();
      console.log('Group details:', JSON.stringify(detailData, null, 2));

      const response = await context.request.post(`/api/groups/${groupId}/admins`, {
        data: {
          user_id: user2.id,
          role: 'admin',
        },
      });

      console.log('Promote admin response status:', response.status());
      const responseText = await response.text();
      console.log('Promote admin response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.message).toContain('promoted');
    });
  });

  test.describe('Group Invite Links', () => {
    test('should get group info by invite link', async ({ context }) => {
      // Create users and group
      await registerAndLoginAPI(context, 'join1');
      const user2 = await createUser(context, 'join2');
      const user3 = await createUser(context, 'join3');
      
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Join Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      const groupId = createData.conversation?.id;
      
      // Generate invite link
      const inviteResponse = await context.request.post(`/api/groups/${groupId}/invite`);
      const inviteData = await inviteResponse.json();
      const inviteLink = inviteData.invite_link;

      const response = await context.request.get(`/api/groups/join/${inviteLink}`);
      console.log('Join by invite response status:', response.status());
      const responseText = await response.text();
      console.log('Join by invite response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.group).toBeDefined();
    });

    test('should return 404 for invalid invite link', async ({ context }) => {
      // Login first
      await registerAndLoginAPI(context, 'invalid');
      
      const response = await context.request.get('/api/groups/join/invalid-link-12345');

      expect(response.status()).toBe(404);
    });

    test('should revoke invite link', async ({ context }) => {
      // Create users and group
      await registerAndLoginAPI(context, 'revoke1');
      const user2 = await createUser(context, 'revoke2');
      const user3 = await createUser(context, 'revoke3');
      
      const createResponse = await context.request.post('/api/conversations', {
        data: {
          is_group: true,
          name: 'Revoke Test Group',
          participant_ids: [user2.id, user3.id],
        },
      });
      
      const createData = await createResponse.json();
      const groupId = createData.conversation?.id;

      const response = await context.request.delete(`/api/groups/${groupId}/invite`);
      console.log('Revoke invite response status:', response.status());
      const responseText = await response.text();
      console.log('Revoke invite response:', responseText);

      expect(response.ok()).toBe(true);
      const data = JSON.parse(responseText);
      expect(data.message).toContain('revoked');
    });
  });

  test.describe('API Security', () => {
    test('should return 401 for unauthenticated group access', async ({ browser }) => {
      const context = await browser.newContext();
      const response = await context.request.get('/api/groups/some-group-id');
      expect(response.status()).toBe(401);
      await context.close();
    });

    test('should return 401 for unauthenticated admin operations', async ({ browser }) => {
      const context = await browser.newContext();
      const response = await context.request.post('/api/groups/some-group-id/admins', {
        data: { user_id: 'some-user-id' },
      });
      expect(response.status()).toBe(401);
      await context.close();
    });
  });
});

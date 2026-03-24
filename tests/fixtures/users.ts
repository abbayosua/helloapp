import { Page } from '@playwright/test';
import { TestUser, generateTestUser, registerUser, loginUser } from './auth';

// Test user pairs for messaging tests
export interface UserPair {
  user1: TestUser & { id?: string };
  user2: TestUser & { id?: string };
}

// Create a pair of test users for messaging
export async function createMessagingUserPair(page: Page): Promise<UserPair> {
  const user1 = generateTestUser('alice');
  const user2 = generateTestUser('bob');
  
  // Register both users
  const result1 = await registerUser(page, user1);
  const result2 = await registerUser(page, user2);
  
  if (result1.success) user1.id = result1.id;
  if (result2.success) user2.id = result2.id;
  
  return { user1, user2 };
}

// Login helper that returns the page with authenticated state
export async function loginAsUser(page: Page, user: TestUser): Promise<boolean> {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  
  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect
  try {
    await page.waitForURL('/', { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

// Create conversation between two users (as user1)
export async function createConversation(
  page: Page, 
  user1Id: string, 
  user2Id: string
): Promise<string | null> {
  const response = await page.request.post('/api/conversations', {
    data: {
      participant_ids: [user2Id],
      is_group: false,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.conversation?.id || null;
  }
  
  return null;
}

// Send a message in a conversation
export async function sendMessage(
  page: Page,
  conversationId: string,
  content: string
): Promise<{ success: boolean; messageId?: string }> {
  const response = await page.request.post(`/api/conversations/${conversationId}/messages`, {
    data: { content },
  });
  
  if (response.ok) {
    const data = await response.json();
    return { success: true, messageId: data.message?.id };
  }
  
  return { success: false };
}

// Get messages in a conversation
export async function getMessages(
  page: Page,
  conversationId: string
): Promise<any[]> {
  const response = await page.request.get(`/api/conversations/${conversationId}/messages`);
  
  if (response.ok) {
    const data = await response.json();
    return data.messages || [];
  }
  
  return [];
}

// Search for a user by name or phone
export async function searchUser(page: Page, query: string): Promise<any[]> {
  const response = await page.request.get(`/api/users/search?q=${encodeURIComponent(query)}`);
  
  if (response.ok) {
    const data = await response.json();
    return data.users || [];
  }
  
  return [];
}

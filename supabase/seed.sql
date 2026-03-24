-- ============================================
-- HelloApp Seed Data
-- Test data for development and testing
-- ============================================

-- Note: User profiles are automatically created via the handle_new_user() trigger
-- when users sign up through Supabase Auth. The seed data below assumes
-- test users have already been created through authentication.

-- ============================================
-- INSTRUCTIONS FOR TESTING
-- ============================================

-- 1. Create test users via Supabase Auth (email/password):
--    - testuser1@example.com (Test User 1)
--    - testuser2@example.com (Test User 2)
--    - testuser3@example.com (Test User 3)

-- 2. The profiles will be auto-created with default values
--    You can then update them with the statements below:

-- ============================================
-- SAMPLE PROFILE UPDATES (run after user signup)
-- ============================================

-- Update test user profiles (replace UUIDs with actual user IDs from auth.users)
-- UPDATE profiles SET 
--   phone = '+1234567890',
--   display_name = 'Test User 1',
--   about = 'Available for testing!',
--   status = 'online'
-- WHERE id = '<user-1-uuid>';

-- UPDATE profiles SET 
--   phone = '+1234567891',
--   display_name = 'Test User 2',
--   about = 'Busy coding...',
--   status = 'online'
-- WHERE id = '<user-2-uuid>';

-- UPDATE profiles SET 
--   phone = '+1234567892',
--   display_name = 'Test User 3',
--   about = 'At work',
--   status = 'offline'
-- WHERE id = '<user-3-uuid>';

-- ============================================
-- SAMPLE CONVERSATIONS (run after profiles exist)
-- ============================================

-- Create a direct conversation between two users
-- INSERT INTO conversations (id, type, created_by)
-- VALUES (gen_random_uuid(), 'direct', '<user-1-uuid>');

-- Add participants to the conversation
-- INSERT INTO conversation_participants (conversation_id, user_id)
-- VALUES 
--   ('<conversation-uuid>', '<user-1-uuid>'),
--   ('<conversation-uuid>', '<user-2-uuid>');

-- Create a group conversation
-- INSERT INTO conversations (id, type, created_by)
-- VALUES (gen_random_uuid(), 'group', '<user-1-uuid>');

-- Create the group metadata
-- INSERT INTO groups (id, name, description, created_by, invite_link)
-- VALUES (
--   '<conversation-uuid>',
--   'Test Group',
--   'A test group for HelloApp',
--   '<user-1-uuid>',
--   'invite-test-group-123'
-- );

-- Add group admin
-- INSERT INTO group_admins (group_id, user_id, role)
-- VALUES ('<conversation-uuid>', '<user-1-uuid>', 'super_admin');

-- Add group participants
-- INSERT INTO conversation_participants (conversation_id, user_id)
-- VALUES 
--   ('<conversation-uuid>', '<user-1-uuid>'),
--   ('<conversation-uuid>', '<user-2-uuid>'),
--   ('<conversation-uuid>', '<user-3-uuid>');

-- ============================================
-- SAMPLE MESSAGES (run after conversations exist)
-- ============================================

-- Insert test messages
-- INSERT INTO messages (conversation_id, sender_id, content, message_type)
-- VALUES 
--   ('<conversation-uuid>', '<user-1-uuid>', 'Hello! This is a test message.', 'text'),
--   ('<conversation-uuid>', '<user-2-uuid>', 'Hi there! Nice to meet you.', 'text'),
--   ('<conversation-uuid>', '<user-1-uuid>', 'How are you doing today?', 'text');

-- ============================================
-- SAMPLE MESSAGE STATUS
-- ============================================

-- Mark messages as delivered and read
-- INSERT INTO message_status (message_id, user_id, delivered_at, read_at)
-- VALUES 
--   ('<message-uuid>', '<user-2-uuid>', NOW(), NOW()),
--   ('<message-uuid>', '<user-1-uuid>', NOW(), NULL);

-- ============================================
-- SAMPLE CONTACTS
-- ============================================

-- Add contacts
-- INSERT INTO contacts (owner_id, phone, name, is_blocked)
-- VALUES 
--   ('<user-1-uuid>', '+1234567891', 'Test User 2', FALSE),
--   ('<user-1-uuid>', '+1234567892', 'Test User 3', FALSE);

-- ============================================
-- SAMPLE MESSAGE REACTIONS
-- ============================================

-- Add emoji reactions to messages
-- INSERT INTO message_reactions (message_id, user_id, emoji)
-- VALUES 
--   ('<message-uuid>', '<user-2-uuid>', '👍'),
--   ('<message-uuid>', '<user-1-uuid>', '❤️');

-- ============================================
-- HELPER FUNCTIONS FOR TESTING
-- ============================================

-- Function to get all conversations for a user with latest message
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  conversation_type VARCHAR(20),
  latest_message TEXT,
  latest_message_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    c.type AS conversation_type,
    m.content AS latest_message,
    m.created_at AS latest_message_at,
    COUNT(ms.id) FILTER (WHERE ms.read_at IS NULL AND m.sender_id != p_user_id) AS unread_count
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  LEFT JOIN LATERAL (
    SELECT content, created_at 
    FROM messages 
    WHERE conversation_id = c.id 
    AND (deleted_at IS NULL OR deleted_for = 'me')
    ORDER BY created_at DESC 
    LIMIT 1
  ) m ON true
  LEFT JOIN message_status ms ON ms.message_id = (
    SELECT id FROM messages 
    WHERE conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) AND ms.user_id = p_user_id
  WHERE cp.user_id = p_user_id
  AND cp.archived = FALSE
  GROUP BY c.id, c.type, m.content, m.created_at
  ORDER BY m.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO message_status (message_id, user_id, delivered_at, read_at)
  SELECT 
    m.id,
    p_user_id,
    COALESCE(ms.delivered_at, NOW()),
    NOW()
  FROM messages m
  LEFT JOIN message_status ms ON ms.message_id = m.id AND ms.user_id = p_user_id
  WHERE m.conversation_id = p_conversation_id
  AND m.sender_id != p_user_id
  AND (ms.read_at IS NULL OR ms.id IS NULL)
  ON CONFLICT (message_id, user_id) 
  DO UPDATE SET read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation partner (for direct chats)
CREATE OR REPLACE FUNCTION get_conversation_partner(p_conversation_id UUID, p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name VARCHAR(100),
  avatar_url TEXT,
  status VARCHAR(20),
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.status,
    p.last_seen
  FROM profiles p
  JOIN conversation_participants cp ON cp.user_id = p.id
  WHERE cp.conversation_id = p_conversation_id
  AND cp.user_id != p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CLEANUP FUNCTION (for testing)
-- ============================================

-- Function to clean all test data (use with caution!)
CREATE OR REPLACE FUNCTION clean_test_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM message_reactions;
  DELETE FROM message_status;
  DELETE FROM messages;
  DELETE FROM group_admins;
  DELETE FROM groups;
  DELETE FROM conversation_participants;
  DELETE FROM conversations;
  DELETE FROM contacts;
  -- Profiles are linked to auth.users, clean via auth
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Get all conversations for a user:
-- SELECT * FROM get_user_conversations('<user-uuid>');

-- Mark all messages in a conversation as read:
-- SELECT mark_conversation_read('<conversation-uuid>', '<user-uuid>');

-- Get conversation partner info:
-- SELECT * FROM get_conversation_partner('<conversation-uuid>', '<your-user-uuid>');

-- Clean test data (WARNING: destructive!):
-- SELECT clean_test_data();

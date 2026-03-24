-- Fix RLS Policy for conversations INSERT
-- The issue might be with how "TO authenticated" is evaluated

-- First, drop ALL existing INSERT policies
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Allow authenticated insert on conversations" ON conversations;

-- Create a new policy that uses auth.uid() instead of TO authenticated
-- This checks that there's a logged-in user
CREATE POLICY "Allow authenticated insert" ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix conversation_participants
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated insert on conversation_participants" ON conversation_participants;

CREATE POLICY "Allow authenticated insert" ON conversation_participants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix messages
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated insert on messages" ON messages;

CREATE POLICY "Allow authenticated insert" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the policies
SELECT policyname, permissive, roles, cmd, with_check::text
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
AND cmd = 'INSERT';

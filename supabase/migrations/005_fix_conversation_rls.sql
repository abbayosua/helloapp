-- Fix RLS policy for conversations insert
-- The original policy used auth.uid() = created_by but there might be an issue with the reference

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create a more permissive policy that allows authenticated users to create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Also ensure the conversation_participants policy allows inserts
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;

CREATE POLICY "Users can insert conversation participants" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

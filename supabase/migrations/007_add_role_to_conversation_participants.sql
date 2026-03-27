-- Add role column to conversation_participants table
-- This allows tracking member/admin/super_admin roles per participant

ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member' 
CHECK (role IN ('member', 'admin', 'super_admin'));

-- Update existing group admins to have 'admin' role
UPDATE conversation_participants cp
SET role = ga.role
FROM group_admins ga
WHERE cp.conversation_id = ga.group_id 
AND cp.user_id = ga.user_id;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_role 
ON conversation_participants(role);

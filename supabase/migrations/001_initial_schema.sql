-- ============================================
-- HelloApp Initial Database Schema
-- A WhatsApp-inspired messaging app
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- 1. profiles (extends auth.users)
-- Stores user profile information
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  about TEXT DEFAULT 'Hey there! I am using HelloApp',
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. conversations
-- Chat threads (both direct and group)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. conversation_participants
-- User-conversation membership
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 4. groups
-- Group metadata (one-to-one with conversations)
CREATE TABLE groups (
  id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invite_link VARCHAR(100) UNIQUE,
  only_admins_send BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. group_admins
-- Group administrators
CREATE TABLE group_admins (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  PRIMARY KEY (group_id, user_id)
);

-- 6. messages
-- All messages (text, media, etc.)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'voice_note')),
  media_url TEXT,
  media_metadata JSONB,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  forwarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_for VARCHAR(20) CHECK (deleted_for IN ('me', 'everyone'))
);

-- 7. message_status
-- Delivery/read tracking per recipient
CREATE TABLE message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);

-- 8. contacts
-- User contacts (phone-based)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, phone)
);

-- 9. message_reactions
-- Emoji reactions to messages
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Messages indexes (critical for performance)
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- Conversation participants indexes
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);

-- Profiles indexes
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Message status indexes
CREATE INDEX idx_message_status_message ON message_status(message_id);
CREATE INDEX idx_message_status_user ON message_status(user_id);

-- Contacts indexes
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);

-- Message reactions indexes
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);

-- Groups indexes
CREATE INDEX idx_groups_invite_link ON groups(invite_link);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: profiles
-- ============================================

-- Users can view all profiles (needed for messaging)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES: conversations
-- ============================================

-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update conversations they're part of
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: conversation_participants
-- ============================================

-- Users can view participants in their conversations
CREATE POLICY "Users can view their conversation participants" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Users can insert themselves into conversations (via system)
CREATE POLICY "Users can insert conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

-- Users can update their own participation settings
CREATE POLICY "Users can update own participation" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Users can remove themselves from conversations
CREATE POLICY "Users can delete own participation" ON conversation_participants
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: groups
-- ============================================

-- Users can view groups they're part of
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = groups.id AND user_id = auth.uid()
    )
  );

-- Group admins can update group settings
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_admins
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Users can create groups (they become creator)
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (true);

-- ============================================
-- RLS POLICIES: group_admins
-- ============================================

-- Users can view group admins of groups they're in
CREATE POLICY "Users can view group admins" ON group_admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = group_admins.group_id AND user_id = auth.uid()
    )
  );

-- Group admins can add other admins
CREATE POLICY "Group admins can manage admins" ON group_admins
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM group_admins ga
      WHERE ga.group_id = group_admins.group_id AND ga.user_id = auth.uid()
    )
  );

-- Group admins can remove other admins
CREATE POLICY "Group admins can delete admins" ON group_admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_admins ga
      WHERE ga.group_id = group_admins.group_id AND ga.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: messages
-- ============================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Users can update their own messages (for deletion)
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Users can soft-delete their own messages
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- ============================================
-- RLS POLICIES: message_status
-- ============================================

-- Users can view message status for messages they sent or received
CREATE POLICY "Users can view message status" ON message_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_status.message_id
      AND (m.sender_id = auth.uid() OR EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = m.conversation_id AND cp.user_id = auth.uid()
      ))
    )
  );

-- Users can insert status for messages in their conversations
CREATE POLICY "Users can insert message status" ON message_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own read/delivered status
CREATE POLICY "Users can update own message status" ON message_status
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: contacts
-- ============================================

-- Users can only see their own contacts
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts" ON contacts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- RLS POLICIES: message_reactions
-- ============================================

-- Users can view reactions in their conversations
CREATE POLICY "Users can view message reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );

-- Users can add reactions to messages in their conversations
CREATE POLICY "Users can insert message reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete own message reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Add tables to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_status;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to messages
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup (create profile automatically)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'online'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update conversation's updated_at when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (limited)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON profiles TO anon;

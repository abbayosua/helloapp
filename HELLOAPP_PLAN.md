# HelloApp - Architecture Plan

> A WhatsApp-inspired messaging app built with Next.js 16 and Supabase

---

## 📱 App Name: HelloApp

**Tagline**: *"Say Hello to the World"*

---

## ❓ Q&A

### 1. Is the UI/UX same like WhatsApp?
**Answer**: Yes! We'll follow WhatsApp's core design patterns:
- ✅ Same layout structure (sidebar + chat area)
- ✅ Similar message bubbles (sent = green right, received = gray left)
- ✅ Double-tick read receipts
- ✅ Typing indicators
- ✅ Online/Last seen status
- ✅ Dark/Light mode support
- 🎨 Custom branding with "HelloApp" name and logo

### 2. Is it using Supabase Auth?
**Answer**: Yes! We'll use **Supabase Auth** exclusively:
- ✅ Email + Password (for testing, no email confirmation required)
- ✅ Google OAuth (social login)
- ✅ Session management handled by Supabase
- ✅ Row Level Security (RLS) for data protection

### 3. Are you gonna test using Playwright?
**Answer**: Yes! We'll implement Playwright E2E tests:
- ✅ Test authentication flows
- ✅ Test messaging functionality
- ✅ Test real-time features
- ✅ Auto-fix failing tests until they pass

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (Email + Google) |
| **Real-time** | Supabase Realtime |
| **State** | Zustand + TanStack Query |
| **Testing** | Playwright |

---

## 🧬 Atomic Design Principle

We follow the **Atomic Design** methodology for building UI components systematically. This approach creates consistent, reusable, and scalable components.

### The 5 Levels of Atomic Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PAGES                                      │
│              (Complete screens with real data)                       │
│    e.g., LoginPage, ChatPage, ProfilePage                           │
├─────────────────────────────────────────────────────────────────────┤
│                         TEMPLATES                                    │
│           (Page layouts without real content)                        │
│    e.g., AuthLayout, MainLayout, ChatLayout                         │
├─────────────────────────────────────────────────────────────────────┤
│                         ORGANISMS                                    │
│        (Complex components made of molecules + atoms)                │
│    e.g., ChatHeader, MessageList, Sidebar, ProfileCard              │
├─────────────────────────────────────────────────────────────────────┤
│                          MOLECULES                                   │
│          (Simple combinations of atoms working together)             │
│    e.g., SearchInput, MessageBubble, ChatItem, TypingIndicator      │
├─────────────────────────────────────────────────────────────────────┤
│                           ATOMS                                      │
│            (Smallest, indivisible UI elements)                       │
│    e.g., Button, Input, Avatar, Icon, Badge, Checkbox              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

#### 🔵 ATOMS (Basic Building Blocks)
> Smallest UI elements that can't be broken down further

| Component | Description | Props |
|-----------|-------------|-------|
| `Avatar` | User profile image with fallback | src, alt, size, status |
| `Badge` | Small status indicator | count, variant |
| `Button` | Clickable action element | variant, size, loading |
| `Checkbox` | Boolean input | checked, onChange |
| `Icon` | SVG icon wrapper | name, size, color |
| `Input` | Text input field | type, placeholder, error |
| `Spinner` | Loading indicator | size, color |
| `Timestamp` | Formatted time display | date, format |
| `OnlineIndicator` | Green dot for online status | isOnline |
| `Checkbox` | Selection input | checked, onChange |
| `Divider` | Horizontal/Vertical separator | orientation |

#### 🟢 MOLECULES (Combinations of Atoms)
> Simple groups of atoms working together as a unit

| Component | Composition | Description |
|-----------|-------------|-------------|
| `SearchInput` | Input + Icon + Button | Search bar with clear action |
| `MessageBubble` | Card + Text + Timestamp + Status | Single message display |
| `ChatItem` | Avatar + Text + Timestamp + Badge | Conversation list item |
| `TypingIndicator` | Avatar + AnimatedDots | Shows who's typing |
| `MessageStatus` | Icon + Text | Sent/Delivered/Read status |
| `FormField` | Label + Input + ErrorMessage | Form field wrapper |
| `UserAvatar` | Avatar + OnlineIndicator | Avatar with status |
| `MenuItem` | Icon + Text + Badge | Sidebar menu item |
| `ReactionBadge` | Emoji + Count | Message reaction display |
| `ContactItem` | Avatar + Name + Phone | Contact list item |

#### 🟡 ORGANISMS (Complex Components)
> Complex compositions of molecules and atoms

| Component | Composition | Description |
|-----------|-------------|-------------|
| `ChatHeader` | Avatar + Text + Actions + Menu | Chat top bar |
| `MessageList` | MessageBubble[] + DateSeparators | Scrollable messages |
| `MessageInput` | Input + Attachment + Emoji + Send | Message composer |
| `Sidebar` | Header + SearchInput + ChatItem[] | Conversation list panel |
| `ProfileCard` | Avatar + Name + About + Actions | User profile display |
| `ChatList` | SearchInput + ChatItem[] | All conversations |
| `Header` | Logo + Menu + UserAvatar | Main navigation |
| `LoginForm` | FormField[] + Button + Links | Login form |
| `CreateGroupForm` | Input + Avatar + MemberList + Actions | Group creation |
| `SettingsPanel` | MenuItem[] + Sections | Settings list |

#### 🟠 TEMPLATES (Page Layouts)
> Page structures without real content

| Template | Description |
|----------|-------------|
| `AuthLayout` | Centered card layout for auth pages |
| `MainLayout` | Sidebar + Content area split |
| `ChatLayout` | Chat list + Active chat view |
| `SettingsLayout` | Settings sidebar + Content |

#### 🔴 PAGES (Real Screens)
| Component | Route | Description |
|-----------|-------|-------------|
| `LoginPage` | /login | User login |
| `RegisterPage` | /register | User registration |
| `ChatPage` | /chat/[id] | Conversation view |
| `ProfilePage` | /profile | User profile |
| `SettingsPage` | /settings | App settings |

---

## 📁 Project Structure (Atomic Design)

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx           # Login Page
│   │   ├── register/page.tsx        # Register Page
│   │   └── layout.tsx               # Auth Template
│   ├── (main)/
│   │   ├── layout.tsx               # Main Template
│   │   ├── page.tsx                 # Home Page (Chat list)
│   │   ├── chat/[conversationId]/
│   │   │   └── page.tsx             # Chat Page
│   │   ├── profile/
│   │   │   └── page.tsx             # Profile Page
│   │   └── new/
│   │       └── page.tsx             # New Chat Page
│   ├── api/
│   │   ├── auth/route.ts
│   │   ├── conversations/route.ts
│   │   ├── messages/route.ts
│   │   └── users/route.ts
│   └── layout.tsx
│
├── components/
│   │
│   ├── atoms/                        # 🔵 ATOMS
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── checkbox.tsx
│   │   ├── divider.tsx
│   │   ├── icon.tsx
│   │   ├── index.ts                 # Export all atoms
│   │   ├── input.tsx
│   │   ├── online-indicator.tsx
│   │   ├── spinner.tsx
│   │   └── timestamp.tsx
│   │
│   ├── molecules/                    # 🟢 MOLECULES
│   │   ├── chat-item.tsx
│   │   ├── contact-item.tsx
│   │   ├── form-field.tsx
│   │   ├── index.ts                 # Export all molecules
│   │   ├── menu-item.tsx
│   │   ├── message-bubble.tsx
│   │   ├── message-status.tsx
│   │   ├── reaction-badge.tsx
│   │   ├── search-input.tsx
│   │   ├── typing-indicator.tsx
│   │   └── user-avatar.tsx
│   │
│   ├── organisms/                    # 🟡 ORGANISMS
│   │   ├── chat-header.tsx
│   │   ├── chat-list.tsx
│   │   ├── create-group-form.tsx
│   │   ├── header.tsx
│   │   ├── index.ts                 # Export all organisms
│   │   ├── login-form.tsx
│   │   ├── message-input.tsx
│   │   ├── message-list.tsx
│   │   ├── profile-card.tsx
│   │   ├── settings-panel.tsx
│   │   └── sidebar.tsx
│   │
│   ├── templates/                    # 🟠 TEMPLATES
│   │   ├── auth-layout.tsx
│   │   ├── chat-layout.tsx
│   │   ├── index.ts                 # Export all templates
│   │   └── main-layout.tsx
│   │
│   └── ui/                           # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── tabs.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── tooltip.tsx
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-conversations.ts
│   ├── use-messages.ts
│   ├── use-presence.ts
│   └── use-realtime.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── middleware.ts            # Auth middleware
│   │   └── server.ts                # Server client
│   ├── utils.ts
│   └── constants.ts
│
├── stores/
│   ├── auth-store.ts
│   ├── chat-store.ts
│   └── ui-store.ts
│
├── types/
│   ├── chat.ts
│   ├── database.ts                  # Supabase generated types
│   └── user.ts
│
└── styles/
    └── globals.css
```

---

## 📊 Database Schema (Supabase)

### 1. profiles (extends auth.users)
```sql
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
```

### 2. conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'direct',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. conversation_participants
```sql
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
```

### 4. groups
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id),
  invite_link VARCHAR(100) UNIQUE,
  only_admins_send BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. group_admins
```sql
CREATE TABLE group_admins (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin',
  PRIMARY KEY (group_id, user_id)
);
```

### 6. messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text',
  media_url TEXT,
  media_metadata JSONB,
  reply_to UUID REFERENCES messages(id),
  forwarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_for VARCHAR(20)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

### 7. message_status
```sql
CREATE TABLE message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);
```

### 8. contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, phone)
);
```

### 9. message_reactions
```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);
```

---

## 🔄 Supabase Realtime Configuration

```sql
-- Enable realtime for tables
ALTER publication supabase_realtime ADD TABLE messages;
ALTER publication supabase_realtime ADD TABLE message_status;
ALTER publication supabase_realtime ADD TABLE message_reactions;
ALTER publication supabase_realtime ADD TABLE conversation_participants;
ALTER publication supabase_realtime ADD TABLE profiles;
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation ⬅️ START HERE
- [ ] Setup environment variables
- [ ] Configure Supabase client (browser + server)
- [ ] Create database schema in Supabase
- [ ] Setup Supabase Auth (Email + Google)
- [ ] Build Atoms (Avatar, Button, Input, etc.)
- [ ] Build Molecules (FormField, SearchInput, etc.)
- [ ] Build Organisms (LoginForm, Header, etc.)
- [ ] Build Auth Template
- [ ] Build Auth Pages (Login, Register)
- [ ] User profile management

### Phase 2: Core Messaging
- [ ] Build ChatItem molecule
- [ ] Build MessageBubble molecule
- [ ] Build MessageList organism
- [ ] Build MessageInput organism
- [ ] Build ChatHeader organism
- [ ] Build Sidebar organism
- [ ] Build ChatLayout template
- [ ] Conversation list UI
- [ ] Create new conversation
- [ ] Send/Receive text messages
- [ ] Real-time subscription
- [ ] Message status indicators
- [ ] Typing indicators

### Phase 3: User Experience
- [ ] Online/Offline presence
- [ ] Last seen status
- [ ] Message reactions
- [ ] Reply to messages
- [ ] Search messages

### Phase 4: Contacts & Social
- [ ] Contact sync (by phone number)
- [ ] Find users by phone
- [ ] Block/Unblock users

### Phase 5: Group Chats
- [ ] Create group
- [ ] Group management
- [ ] Group invite links

### Phase 6: Media Sharing
- [ ] Image upload
- [ ] Video upload
- [ ] Voice notes
- [ ] Documents

### Phase 7: Advanced
- [ ] Voice/Video calls (WebRTC)
- [ ] Status/Stories

---

## 🧪 Testing Strategy (Playwright)

### Test Suites

```
tests/
├── auth.spec.ts              # Login, Register, Logout
├── chat.spec.ts              # Send message, Real-time
├── profile.spec.ts           # Update profile
└── navigation.spec.ts        # Page navigation
```

### Testing Approach
1. Write test for feature
2. Run test
3. If failing → Fix immediately
4. Re-run until passing
5. Commit changes

---

## 🔐 Security (Row Level Security)

```sql
-- Profiles: Users can only modify their own
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Messages: Users can only see messages in their conversations
CREATE POLICY "Users view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );
```

---

## 📝 GitHub Commit Strategy

**Committer**: abbayosua (abbasiagian@gmail.com)

**Commit on**:
- Every completed feature
- Every fixed bug
- Every passing test suite
- Meaningful milestones

**Commit message format**:
```
feat: add user authentication
fix: resolve realtime subscription issue
test: add auth flow tests
docs: update README
```

---

## ✅ Ready to Start!

Next step: **Phase 1 - Foundation**

1. Create environment files
2. Setup Supabase client
3. Create database tables
4. Implement authentication
5. Test with Playwright

Let's build HelloApp! 🚀

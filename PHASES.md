# HelloApp Development Phases

> Complete roadmap for building a WhatsApp clone with Next.js and Supabase

---

## 📋 Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation | ✅ Complete | Auth, database, basic UI |
| 2 | Core Messaging | ✅ Complete | Real-time chat functionality |
| 3 | User Experience | 🔵 Pending | Presence, reactions, replies |
| 4 | Contacts & Social | 🔵 Pending | Contact sync, blocking |
| 5 | Group Chats | 🔵 Pending | Group management |
| 6 | Media Sharing | 🔵 Pending | Images, videos, voice notes |
| 7 | Advanced Features | 🔵 Pending | Calls, stories |
| 8 | Mobile App | 🔵 Pending | React Native + Expo |

---

## Phase 1: Foundation ✅

**Status:** Complete  
**Commit:** `26dadaf`, `e576ec0`

### Goals
- Setup development environment
- Configure Supabase (database, auth)
- Build atomic design component library
- Implement authentication

### Deliverables

#### Environment Setup
- [x] Next.js 16 project with TypeScript
- [x] Tailwind CSS 4 + shadcn/ui
- [x] Supabase client (browser + server)
- [x] Environment variables configured

#### Database
- [x] 9 tables created in Supabase
- [x] Row Level Security (RLS) policies
- [x] Realtime publication configured
- [x] Auto-triggers for profiles, timestamps

#### Atomic Design Components

**🔵 Atoms (10 components)**
| Component | File | Description |
|-----------|------|-------------|
| Avatar | `atoms/avatar.tsx` | User avatar with fallback initials |
| Badge | `atoms/badge.tsx` | Unread count, status badges |
| Button | `atoms/button.tsx` | WhatsApp-themed button variants |
| Divider | `atoms/divider.tsx` | Horizontal/vertical separators |
| Icon | `atoms/icon.tsx` | Lucide icon wrapper with sizes |
| Input | `atoms/input.tsx` | Text input with label support |
| OnlineIndicator | `atoms/online-indicator.tsx` | Green dot for online status |
| Spinner | `atoms/spinner.tsx` | Loading spinner |
| Timestamp | `atoms/timestamp.tsx` | Formatted time display |

**🟢 Molecules (10 components)**
| Component | File | Description |
|-----------|------|-------------|
| ChatItem | `molecules/chat-item.tsx` | Conversation list item |
| FormField | `molecules/form-field.tsx` | Label + Input + Error |
| MenuItem | `molecules/menu-item.tsx` | Sidebar menu item |
| MessageBubble | `molecules/message-bubble.tsx` | Single message display |
| MessageStatus | `molecules/message-status.tsx` | Sent/Delivered/Read ticks |
| ReactionBadge | `molecules/reaction-badge.tsx` | Emoji reaction display |
| SearchInput | `molecules/search-input.tsx` | Search bar with clear |
| TypingIndicator | `molecules/typing-indicator.tsx` | Animated typing dots |
| UserAvatar | `molecules/user-avatar.tsx` | Avatar + Online status |

**🟡 Organisms (2 components)**
| Component | File | Description |
|-----------|------|-------------|
| LoginForm | `organisms/login-form.tsx` | Email/password login |
| RegisterForm | `organisms/register-form.tsx` | New user registration |

**🟠 Templates (1 component)**
| Component | File | Description |
|-----------|------|-------------|
| AuthLayout | `templates/auth-layout.tsx` | Split-screen auth layout |

#### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/register` | POST | Create new user |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/logout` | POST | Sign out user |
| `/api/auth/me` | GET | Get current user |

#### Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password login |
| Register | `/register` | New user signup |
| Home | `/` | Chat interface (protected) |

#### Testing
- [x] Playwright configured
- [x] 8 auth tests passing

---

## Phase 2: Core Messaging ✅

**Status:** Complete  
**Commit:** `cea6849`

### Goals
- Real-time messaging
- Conversation management
- User search functionality

### Deliverables

#### API Routes (11 new routes)

**Conversations**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/conversations` | GET | List user's conversations |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations/[id]` | GET | Get conversation details |
| `/api/conversations/[id]` | PATCH | Update conversation settings |
| `/api/conversations/[id]` | DELETE | Leave/delete conversation |
| `/api/conversations/[id]/messages` | GET | Get paginated messages |
| `/api/conversations/[id]/messages` | POST | Send new message |
| `/api/conversations/[id]/participants` | GET | List participants |
| `/api/conversations/[id]/participants` | POST | Add participants to group |

**Messages**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/messages/[id]` | PATCH | Edit message |
| `/api/messages/[id]` | DELETE | Soft delete message |
| `/api/messages/[id]/read` | POST | Mark as read |
| `/api/messages/[id]/reactions` | GET | Get reactions |
| `/api/messages/[id]/reactions` | POST | Add reaction |
| `/api/messages/[id]/reactions` | DELETE | Remove reaction |

**Users**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/users/search` | GET | Search users by name/phone |
| `/api/users/[id]` | GET | Get user profile |
| `/api/users/profile` | GET | Get current user profile |
| `/api/users/profile` | PATCH | Update profile |
| `/api/users/contacts` | GET | List contacts |
| `/api/users/contacts` | POST | Add contact |
| `/api/users/contacts` | DELETE | Remove/block contact |

#### Organisms (5 new components)

| Component | File | Features |
|-----------|------|----------|
| Sidebar | `organisms/sidebar.tsx` | Conversation list, search, user avatar, realtime updates |
| ChatHeader | `organisms/chat-header.tsx` | Back button, status, call buttons, menu |
| MessageList | `organisms/message-list.tsx` | Paginated messages, date separators, realtime subscriptions |
| MessageInput | `organisms/message-input.tsx` | Typing broadcast, emoji picker, attachments menu |
| NewChatDialog | `organisms/new-chat-dialog.tsx` | User search, create conversation |

#### Features
- [x] Supabase Realtime for messages
- [x] Typing indicators via broadcast
- [x] Message pagination (infinite scroll)
- [x] User search by name/phone
- [x] Mobile responsive design

---

## Phase 3: User Experience 🔵

**Status:** Pending

### Goals
- Online/offline presence
- Message reactions
- Reply to messages
- Search functionality

### Planned Deliverables

#### Features
- [ ] Presence system (online/offline/away)
- [ ] Last seen timestamp
- [ ] Message reactions (emoji picker)
- [ ] Reply to specific messages
- [ ] Search messages in conversation
- [ ] Message forwarding

#### Components
- [ ] PresenceIndicator atom
- [ ] ReactionPicker molecule
- [ ] ReplyPreview molecule
- [ ] SearchDialog organism

#### API Routes
- [ ] `PATCH /api/users/presence` - Update status
- [ ] `GET /api/conversations/[id]/search` - Search messages

---

## Phase 4: Contacts & Social 🔵

**Status:** Pending

### Goals
- Contact synchronization
- User discovery
- Blocking functionality

### Planned Deliverables

#### Features
- [ ] Sync phone contacts
- [ ] Find users by phone number
- [ ] Block/unblock users
- [ ] Profile QR code sharing
- [ ] Profile link sharing

#### Components
- [ ] ContactList organism
- [ ] BlockedList organism
- [ ] QRCodeDisplay organism
- [ ] ProfileShare molecule

#### API Routes
- [ ] `POST /api/users/contacts/sync` - Bulk sync contacts
- [ ] `GET /api/users/blocked` - List blocked users

---

## Phase 5: Group Chats 🔵

**Status:** Pending

### Goals
- Create and manage groups
- Group admin features
- Invite links

### Planned Deliverables

#### Features
- [ ] Create group (up to 256 members)
- [ ] Add/remove members
- [ ] Promote/demote admins
- [ ] Group settings (name, avatar, description)
- [ ] Group invite links
- [ ] Admin-only messaging option
- [ ] Mention @all

#### Components
- [ ] CreateGroupDialog organism
- [ ] GroupInfo organism
- [ ] GroupMemberList organism
- [ ] AddMembersDialog organism

#### API Routes
- [ ] `POST /api/groups` - Create group
- [ ] `PATCH /api/groups/[id]` - Update group settings
- [ ] `DELETE /api/groups/[id]/members/[userId]` - Remove member
- [ ] `POST /api/groups/[id]/admins` - Promote admin
- [ ] `GET /api/groups/join/[inviteLink]` - Join via link

---

## Phase 6: Media Sharing 🔵

**Status:** Pending

### Goals
- Image/video sharing
- Voice notes
- Document sharing

### Planned Deliverables

#### Features
- [ ] Image upload & preview
- [ ] Video upload & preview
- [ ] Voice note recording
- [ ] Document sharing (PDF, etc.)
- [ ] Media gallery view
- [ ] Supabase Storage integration

#### Components
- [ ] MediaPicker organism
- [ ] VoiceRecorder organism
- [ ] MediaGallery organism
- [ ] ImagePreview molecule
- [ ] VideoPlayer molecule

#### API Routes
- [ ] `POST /api/upload` - Upload media
- [ ] `GET /api/conversations/[id]/media` - Get media gallery

---

## Phase 7: Advanced Features 🔵

**Status:** Pending

### Goals
- Voice/video calls
- Status/Stories

### Planned Deliverables

#### Features
- [ ] Voice calls (WebRTC)
- [ ] Video calls (WebRTC)
- [ ] Status/Stories (24h disappearing)
- [ ] Status replies
- [ ] Mute status from contacts

#### Components
- [ ] CallScreen organism
- [ ] IncomingCallDialog organism
- [ ] StatusList organism
- [ ] StatusViewer organism
- [ ] StatusCreator organism

#### Infrastructure
- [ ] WebRTC signaling server
- [ ] TURN/STUN servers

---

## Phase 8: Mobile App 🔵

**Status:** Pending

### Goals
- React Native + Expo
- Share backend with web

### Planned Deliverables

#### Setup
- [ ] Expo project initialization
- [ ] Shared types and API client
- [ ] Native navigation

#### Features
- [ ] All web features on mobile
- [ ] Push notifications
- [ ] Background sync
- [ ] Camera integration
- [ ] Native share sheet

#### Platform-Specific
- [ ] iOS specific UI patterns
- [ ] Android specific UI patterns
- [ ] Biometric authentication

---

## 📁 Project Structure

```
helloapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # Main app route group
│   │   │   └── page.tsx       # Home page
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── conversations/
│   │   │   ├── messages/
│   │   │   └── users/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── atoms/             # Basic building blocks
│   │   ├── molecules/         # Atom combinations
│   │   ├── organisms/         # Complex components
│   │   ├── templates/         # Page layouts
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── supabase/         # Supabase clients
│   │   └── utils.ts
│   ├── stores/               # Zustand stores
│   └── types/                # TypeScript types
├── supabase/
│   └── migrations/           # Database migrations
├── tests/                    # Playwright tests
└── HELLOAPP_PLAN.md         # Architecture plan
```

---

## 🧪 Testing Strategy

### Playwright Tests

| Suite | Tests | Status |
|-------|-------|--------|
| Auth Flow | 8 | ✅ Passing |
| Messaging | 1 (skipped) | 🔵 Pending |

### Test Coverage Goals
- Auth flows: 100%
- Messaging: 80%
- Groups: 70%
- Media: 60%

---

## 🚀 Deployment

### Current
- Development: `localhost:3000`
- Database: Supabase Cloud (ap-southeast-1)

### Production (Future)
- Vercel for Next.js
- Supabase Cloud
- Environment variables via Vercel

---

## 📝 Notes

- All commits by: **abbayosua** (abbasiagian@gmail.com)
- Repository: https://github.com/abbayosua/helloapp
- Following Atomic Design methodology
- WhatsApp-inspired UI/UX

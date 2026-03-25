# HelloApp Development Phases

> Complete roadmap for building a WhatsApp clone with Next.js and Supabase

---

## 📋 Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation | ✅ Complete | Auth, database, basic UI |
| 2 | Core Messaging | ✅ Complete | Real-time chat functionality |
| 3 | User Experience | ✅ Complete | Presence, reactions, replies |
| 4 | Contacts & Social | ✅ Complete | Contact sync, blocking |
| 5 | Group Chats | ✅ Complete | Group management |
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

## Phase 3: User Experience ✅

**Status:** Complete
**Commit:** `3fbb53e`

### Goals
- Online/offline presence
- Message reactions
- Reply to messages
- Search functionality

### Deliverables

#### Features
- [x] Presence system (online/offline/away)
- [x] Last seen timestamp
- [x] Message reactions (emoji picker)
- [x] Reply to specific messages
- [x] Search messages in conversation

#### Components
- [x] ReactionPicker molecule
- [x] ReplyPreview molecule
- [x] SearchDialog organism

#### API Routes
- [x] `PATCH /api/users/presence` - Update status
- [x] `GET /api/users/presence` - Get presence for users
- [x] `GET /api/conversations/[id]/search` - Search messages

#### Hooks
- [x] `usePresence` - Track and broadcast user presence

#### Testing
- [x] 8 Playwright tests passing

---

## Phase 4: Contacts & Social ✅

**Status:** Complete
**Commit:** `23f9547`

### Goals
- Contact synchronization
- User discovery
- Blocking functionality

### Deliverables

#### Features
- [x] Sync phone contacts (bulk)
- [x] Find users by phone number
- [x] Block/unblock users
- [x] Blocked users list

#### API Routes
- [x] `POST /api/users/contacts` - Add contact or bulk sync
- [x] `GET /api/users/contacts?blocked_only=true` - List blocked users
- [x] `DELETE /api/users/contacts?block=true` - Block contact

#### Testing
- [x] 9 Playwright tests passing

---

## Phase 5: Group Chats ✅

**Status:** Complete

### Goals
- Create and manage groups
- Group admin features
- Invite links

### Deliverables

#### Features
- [x] Create group (up to 256 members)
- [x] Add/remove members
- [x] Promote/demote admins
- [x] Group settings (name, avatar, description)
- [x] Group invite links
- [x] Admin-only messaging option (database field ready)
- [x] Creator automatically becomes super_admin

#### Components
- [x] CreateGroupDialog organism
- [x] GroupInfo organism (view details, manage admins, leave group)

#### API Routes
- [x] `GET /api/groups/[id]` - Get group details
- [x] `PATCH /api/groups/[id]` - Update group settings
- [x] `DELETE /api/groups/[id]` - Leave group
- [x] `POST /api/groups/[id]/members` - Add members
- [x] `DELETE /api/groups/[id]/members` - Remove member
- [x] `GET /api/groups/[id]/admins` - List admins
- [x] `POST /api/groups/[id]/admins` - Promote member
- [x] `DELETE /api/groups/[id]/admins` - Demote admin
- [x] `GET /api/groups/[id]/invite` - Get invite link
- [x] `POST /api/groups/[id]/invite` - Generate invite link
- [x] `DELETE /api/groups/[id]/invite` - Revoke invite link
- [x] `GET /api/groups/join/[inviteLink]` - Get group info by invite
- [x] `POST /api/groups/join/[inviteLink]` - Join via invite link

#### Testing
- [x] 13 Playwright tests passing

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
| Auth Flow | 9 | ✅ Passing |
| Phase 2: Messaging | 9 | ✅ Passing |
| Phase 3: User Experience | 8 | ✅ Passing |
| Phase 4: Contacts & Social | 9 | ✅ Passing |
| Phase 5: Group Chats | 13 | ✅ Passing |

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

# HelloApp 📱

> A WhatsApp-inspired messaging app built with Next.js 16 and Supabase

**Say Hello to the World** 👋

---

## 🌟 Features

- 💬 Real-time messaging with Supabase Realtime
- 🔐 Secure authentication (Email + Google OAuth)
- 👥 Direct and group conversations
- 📱 Responsive design (WhatsApp-style UI)
- 🌙 Dark/Light mode support
- ✅ Message delivery & read receipts
- ⌨️ Typing indicators
- 🟢 Online/Offline presence
- 😊 Message reactions
- 📎 Media sharing (coming soon)
- 📞 Voice/Video calls (coming soon)

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth |
| **Real-time** | Supabase Realtime |
| **State** | Zustand + TanStack Query |
| **Testing** | Playwright |

---

## 🧬 Architecture: Atomic Design

HelloApp follows the **Atomic Design** methodology for building UI components:

```
┌─────────────────────────────────────────────────┐
│                     PAGES                        │
│         (Complete screens with real data)        │
├─────────────────────────────────────────────────┤
│                   TEMPLATES                      │
│       (Page layouts without real content)        │
├─────────────────────────────────────────────────┤
│                   ORGANISMS                      │
│    (Complex components: Header, Sidebar, etc.)   │
├─────────────────────────────────────────────────┤
│                    MOLECULES                     │
│    (Simple combinations: SearchInput, etc.)      │
├─────────────────────────────────────────────────┤
│                     ATOMS                        │
│    (Basic elements: Button, Input, Avatar)       │
└─────────────────────────────────────────────────┘
```

See [HELLOAPP_PLAN.md](./HELLOAPP_PLAN.md) for detailed component hierarchy.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── atoms/             # Basic UI elements
│   ├── molecules/         # Combinations of atoms
│   ├── organisms/         # Complex components
│   ├── templates/         # Page layouts
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configs
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── styles/                # Global styles
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abbayosua/helloapp.git
cd helloapp
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Run the development server:
```bash
bun run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Database Schema

HelloApp uses the following tables in Supabase:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `conversations` | Chat threads |
| `conversation_participants` | User-conversation membership |
| `groups` | Group metadata |
| `group_admins` | Group administrators |
| `messages` | All messages |
| `message_status` | Delivery/read tracking |
| `contacts` | User contacts |
| `message_reactions` | Emoji reactions |

See [HELLOAPP_PLAN.md](./HELLOAPP_PLAN.md) for complete schema definitions.

---

## 🧪 Testing

Run Playwright E2E tests:

```bash
# Install Playwright browsers
bunx playwright install

# Run tests
bun run test

# Run tests with UI
bunx playwright test --ui
```

---

## 📝 Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | 🔵 Planned | Foundation (Auth, Profile, Layout) |
| **Phase 2** | ⚪ Pending | Core Messaging |
| **Phase 3** | ⚪ Pending | User Experience |
| **Phase 4** | ⚪ Pending | Contacts & Social |
| **Phase 5** | ⚪ Pending | Group Chats |
| **Phase 6** | ⚪ Pending | Media Sharing |
| **Phase 7** | ⚪ Pending | Advanced Features |

---

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Supabase Auth handles session management
- Service role key never exposed to client
- All API routes validate user authentication

---

## 📱 Future: Mobile App

A React Native + Expo mobile app is planned for future development. The backend (Supabase) and business logic will be shared between web and mobile.

---

## 🤝 Contributing

This is currently a personal project. Contributions may be welcomed in the future.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👤 Author

**abbayosua**
- Email: abbasiagian@gmail.com
- GitHub: [@abbayosua](https://github.com/abbayosua)

---

## 🙏 Acknowledgments

- Inspired by [WhatsApp](https://whatsapp.com)
- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)

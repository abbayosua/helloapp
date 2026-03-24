'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { SearchInput } from '@/components/molecules/search-input';
import { ChatItem } from '@/components/molecules/chat-item';
import { UserAvatar } from '@/components/molecules/user-avatar';
import { MessageBubble } from '@/components/molecules/message-bubble';
import { MessageStatus } from '@/components/molecules/message-status';
import { 
  MoreVertical, 
  MessageSquarePlus, 
  LogOut,
  Send,
  Paperclip,
  Mic,
  Smile
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  about: string | null;
}

interface Conversation {
  id: string;
  name: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_own: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Load demo conversations
        setConversations([
          {
            id: '1',
            name: 'John Doe',
            avatar_url: null,
            last_message: 'Hey! How are you?',
            last_message_time: new Date().toISOString(),
            unread_count: 2,
          },
          {
            id: '2',
            name: 'Jane Smith',
            avatar_url: null,
            last_message: 'See you tomorrow!',
            last_message_time: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 0,
          },
          {
            id: '3',
            name: 'Team Group',
            avatar_url: null,
            last_message: 'Meeting at 3pm',
            last_message_time: new Date(Date.now() - 86400000).toISOString(),
            unread_count: 5,
          },
        ]);

        // Load demo messages
        setMessages([
          {
            id: '1',
            content: 'Hey there!',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            sender_id: 'other',
            is_own: false,
          },
          {
            id: '2',
            content: 'Hi! How are you doing?',
            created_at: new Date(Date.now() - 7100000).toISOString(),
            sender_id: user?.id || 'me',
            is_own: true,
          },
          {
            id: '3',
            content: 'I\'m doing great! Just wanted to check in.',
            created_at: new Date(Date.now() - 7000000).toISOString(),
            sender_id: 'other',
            is_own: false,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      created_at: new Date().toISOString(),
      sender_id: user?.id || 'me',
      is_own: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-[400px] bg-white dark:bg-[#111B21] border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-3 bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-between">
          <UserAvatar user={user} size="md" showStatus />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <MoreVertical className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 bg-white dark:bg-[#111B21]">
          <SearchInput
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <ChatItem
              key={conv.id}
              conversation={conv}
              isActive={selectedConversation === conv.id}
              onClick={() => setSelectedConversation(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-[#EFEAE2] dark:bg-[#0B141A]">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  user={{ 
                    display_name: conversations.find(c => c.id === selectedConversation)?.name,
                    avatar_url: null 
                  }} 
                  size="md" 
                  showStatus 
                />
                <div>
                  <h3 className="font-medium text-foreground">
                    {conversations.find(c => c.id === selectedConversation)?.name}
                  </h3>
                  <p className="text-xs text-gray-500">online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('/chat-bg.png')] dark:bg-[#0B141A]">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.is_own}
                  showStatus={msg.is_own}
                  status={msg.is_own ? 'delivered' : undefined}
                />
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="px-4 py-3 bg-[#F0F2F5] dark:bg-[#202C33] flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                <Smile className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                <Paperclip className="h-5 w-5" />
              </Button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-[#2A3942] border-0 focus:outline-none focus:ring-2 focus:ring-[#25D366] text-foreground"
              />
              {newMessage.trim() ? (
                <Button type="submit" size="icon" className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full">
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-64 h-64 mb-8 opacity-20">
              <svg viewBox="0 0 303 172" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M151.5 0C68.1 0 0 68.1 0 151.5V172H303V151.5C303 68.1 234.9 0 151.5 0Z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-700 dark:text-gray-300 mb-2">
              HelloApp Web
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send and receive messages with HelloApp
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

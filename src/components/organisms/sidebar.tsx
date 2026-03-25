'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchInput } from '@/components/molecules/search-input';
import { ChatItem } from '@/components/molecules/chat-item';
import { UserAvatar } from '@/components/molecules/user-avatar';
import { Button } from '@/components/atoms/button';
import { 
  MessageSquarePlus, 
  LogOut,
  Settings,
  Loader2,
  Users,
  ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  about: string | null;
  status: string;
  phone: string | null;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  partner_id?: string;
  partner_status?: string;
}

interface SidebarProps {
  userId: string;
  user: Profile | null;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onNewGroup?: () => void;
  onLogout: () => void;
}

export function Sidebar({
  userId,
  user,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  onNewGroup,
  onLogout,
}: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new messages (to update last message in list)
    const messagesChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [loadConversations]);

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-[400px] bg-white dark:bg-[#111B21] border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="px-4 py-3 bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-between">
        <UserAvatar user={user} size="md" showStatus />
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="New"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNewChat}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New chat
              </DropdownMenuItem>
              {onNewGroup && (
                <DropdownMenuItem onClick={onNewGroup}>
                  <Users className="h-4 w-4 mr-2" />
                  New group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onLogout}
            title="Logout"
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <MessageSquarePlus className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <Button 
              variant="ghost" 
              className="mt-2 text-[#25D366]"
              onClick={onNewChat}
            >
              Start a new chat
            </Button>
            {onNewGroup && (
              <Button 
                variant="ghost" 
                className="text-[#25D366]"
                onClick={onNewGroup}
              >
                Create a group
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ChatItem
              key={conv.id}
              conversation={conv}
              isActive={selectedConversationId === conv.id}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

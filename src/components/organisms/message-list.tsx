'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from '@/components/molecules/message-bubble';
import { TypingIndicator } from '@/components/molecules/typing-indicator';
import { Timestamp } from '@/components/atoms/timestamp';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: Profile;
  message_type: string;
  is_own: boolean;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    reacted: boolean;
  }[];
  is_edited?: boolean;
  deleted_at?: string;
  deleted_for?: string;
}

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
}

export function MessageList({ conversationId, currentUserId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (before?: string) => {
    try {
      const url = `/api/conversations/${conversationId}/messages${before ? `?before=${before}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        if (before) {
          setMessages((prev) => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
          // Mark messages as read
          if (newMessages.length > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.sender_id !== currentUserId) {
              fetch(`/api/messages/${lastMessage.id}/read`, { method: 'POST' });
            }
          }
        }
        
        setHasMore(data.has_more);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    setIsLoading(true);
    setMessages([]);
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const message: Message = {
            ...newMessage,
            is_own: newMessage.sender_id === currentUserId,
            sender: sender || undefined,
          };

          setMessages((prev) => [...prev, message]);
          
          // Mark as read if not own message
          if (newMessage.sender_id !== currentUserId) {
            fetch(`/api/messages/${newMessage.id}/read`, { method: 'POST' });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id
                ? { ...msg, ...updatedMessage, is_own: msg.is_own }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Typing indicator subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.user_id !== currentUserId) {
          setTypingUsers((prev) => {
            const exists = prev.find((u) => u.id === payload.user_id);
            if (!exists && payload.isTyping) {
              return [...prev, payload.user];
            } else if (!payload.isTyping) {
              return prev.filter((u) => u.id !== payload.user_id);
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      loadMessages(messages[0]?.created_at);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    
    messages.forEach((message) => {
      const date = new Date(message.created_at).toDateString();
      const existingGroup = groups.find((g) => g.date === date);
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-1 bg-[url('/chat-pattern.png')] dark:bg-[#0B141A]"
      onScroll={handleScroll}
      style={{
        backgroundImage: 'none',
        backgroundColor: 'var(--chat-bg, #ECE5DD)',
      }}
    >
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {messageGroups.map((group) => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex justify-center my-4">
            <span className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 rounded-lg text-xs text-gray-500 shadow-sm">
              <Timestamp date={group.date} format="date" />
            </span>
          </div>

          {/* Messages */}
          {group.messages.map((message, index) => (
            <div key={message.id} ref={index === group.messages.length - 1 ? lastMessageRef : undefined}>
              <MessageBubble
                message={message}
                isOwn={message.is_own}
                showStatus={message.is_own}
                status={message.is_own ? 'delivered' : undefined}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator user={typingUsers[0]} />
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      )}
    </div>
  );
}

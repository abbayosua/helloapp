'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/organisms/sidebar';
import { ChatHeader } from '@/components/organisms/chat-header';
import { MessageList } from '@/components/organisms/message-list';
import { MessageInput } from '@/components/organisms/message-input';
import { NewChatDialog } from '@/components/organisms/new-chat-dialog';
import { CreateGroupDialog } from '@/components/organisms/create-group-dialog';
import { GroupInfo } from '@/components/organisms/group-info';
import { SearchDialog } from '@/components/organisms/search-dialog';
import { Loader2, Search, Info } from 'lucide-react';
import { usePresence } from '@/hooks/use-presence';
import { Button } from '@/components/atoms/button';

interface Profile {
  id: string;
  email?: string;
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
  partner_id?: string;
  partner_status?: string;
}

interface ReplyToMessage {
  id: string;
  content: string;
  sender_name: string;
}

type DialogType = 'none' | 'newChat' | 'newGroup' | 'search' | 'groupInfo';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogType>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);

  // Presence tracking
  usePresence({
    userId: user?.id || '',
    conversationId: selectedConversation?.id,
    enabled: !!user,
  });

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleSelectConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setIsMobileChatOpen(true);
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = (conversationId: string) => {
    handleSelectConversation(conversationId);
  };

  const handleReply = (message: ReplyToMessage) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleMessageFound = (messageId: string) => {
    console.log('Found message:', messageId);
  };

  const handleLeaveGroup = () => {
    setSelectedConversation(null);
    setIsMobileChatOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#ECE5DD] dark:bg-[#0B141A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
        <Sidebar
          userId={user.id}
          user={user}
          selectedConversationId={selectedConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => setActiveDialog('newChat')}
          onNewGroup={() => setActiveDialog('newGroup')}
          onLogout={handleLogout}
        />
      </div>

      {/* Chat Area */}
      <div className={`${isMobileChatOpen ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            <ChatHeader
              conversationId={selectedConversation.id}
              name={selectedConversation.name}
              avatar_url={selectedConversation.avatar_url}
              status={selectedConversation.partner_status}
              isGroup={selectedConversation.type === 'group'}
              onBack={() => setIsMobileChatOpen(false)}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500"
                    onClick={() => setActiveDialog('search')}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  {selectedConversation.type === 'group' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500"
                      onClick={() => setActiveDialog('groupInfo')}
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  )}
                </>
              }
            />
            <MessageList
              conversationId={selectedConversation.id}
              currentUserId={user.id}
              onReply={handleReply}
            />
            <MessageInput
              conversationId={selectedConversation.id}
              userId={user.id}
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#EFEAE2] dark:bg-[#0B141A] text-gray-500">
            <div className="w-64 h-64 mb-8 opacity-20">
              <svg
                viewBox="0 0 303 172"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path
                  d="M229.565 160.229C262.212 149.245 286.931 118.241 283.39 73.4194C278.009 5.31929 212.365 -23.6605 142.548 22.5194C72.7314 68.6993 6.93409 81.5402 1.36702 134.59C-4.20005 187.64 57.1875 198.437 93.8579 182.935C130.528 167.434 102.98 120.732 142.548 97.8848C182.116 75.0378 229.565 118.241 229.565 160.229Z"
                  fill="currentColor"
                />
                <ellipse cx="138" cy="60" rx="46" ry="36" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-700 dark:text-gray-300 mb-2">
              HelloApp Web
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Send and receive messages with HelloApp
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveDialog('newChat')}
                className="text-[#25D366] hover:underline font-medium"
              >
                Start a new conversation
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setActiveDialog('newGroup')}
                className="text-[#25D366] hover:underline font-medium"
              >
                Create a group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        isOpen={activeDialog === 'newChat'}
        onClose={() => setActiveDialog('none')}
        onConversationCreated={handleNewConversation}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        isOpen={activeDialog === 'newGroup'}
        onClose={() => setActiveDialog('none')}
        onGroupCreated={handleNewConversation}
      />

      {/* Search Dialog */}
      {selectedConversation && (
        <SearchDialog
          isOpen={activeDialog === 'search'}
          onClose={() => setActiveDialog('none')}
          conversationId={selectedConversation.id}
          onMessageClick={handleMessageFound}
        />
      )}

      {/* Group Info Dialog */}
      {selectedConversation?.type === 'group' && (
        <GroupInfo
          groupId={selectedConversation.id}
          currentUserId={user.id}
          onClose={() => setActiveDialog('none')}
          onLeaveGroup={handleLeaveGroup}
        />
      )}
    </div>
  );
}

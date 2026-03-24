'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X } from 'lucide-react';
import { MessageBubble } from '@/components/molecules/message-bubble';
import { Button } from '@/components/atoms/button';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  is_own: boolean;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onMessageClick?: (messageId: string) => void;
}

export function SearchDialog({
  isOpen,
  onClose,
  conversationId,
  onMessageClick,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search messages
  useEffect(() => {
    const searchMessages = async () => {
      if (!debouncedQuery.trim()) {
        setMessages([]);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/search?q=${encodeURIComponent(debouncedQuery)}`
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to search messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      searchMessages();
    }
  }, [debouncedQuery, conversationId, isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMessages([]);
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const handleMessageClick = (message: Message) => {
    onMessageClick?.(message.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-8"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full w-8"
              onClick={() => {
                setQuery('');
                setMessages([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            debouncedQuery.trim() ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No messages found</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Type to search messages</p>
              </div>
            )
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg"
                onClick={() => handleMessageClick(message)}
              >
                <MessageBubble
                  message={{
                    id: message.id,
                    content: message.content,
                    timestamp: message.created_at,
                  }}
                  isOwn={message.is_own}
                  showStatus={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.sender?.display_name || 'Unknown'}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

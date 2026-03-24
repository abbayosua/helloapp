'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Smile, Paperclip, Mic, Send, X, ImageIcon, FileText, MapPin, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MessageInputProps {
  conversationId: string;
  userId: string;
  onMessageSent?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  userId,
  onMessageSent,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Broadcast typing status
  const broadcastTyping = useCallback((typing: boolean) => {
    const supabase = createClient();
    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, isTyping: typing },
    });
  }, [conversationId, userId]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setIsTyping(false);
    broadcastTyping(false);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.trim() }),
      });

      if (response.ok) {
        setMessage('');
        onMessageSent?.();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className="px-2 md:px-4 py-2 md:py-3 bg-[#F0F2F5] dark:bg-[#202C33]">
      {/* Attachment menu */}
      {showAttachments && (
        <div className="flex gap-2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <ImageIcon className="h-5 w-5 text-purple-500" />
            <span className="text-xs">Photo</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-xs">Document</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <MapPin className="h-5 w-5 text-green-500" />
            <span className="text-xs">Location</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <User className="h-5 w-5 text-orange-500" />
            <span className="text-xs">Contact</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto"
            onClick={() => setShowAttachments(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="flex gap-1 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              className="text-2xl hover:scale-125 transition-transform p-1"
              onClick={() => {
                setMessage((prev) => prev + emoji);
                inputRef.current?.focus();
              }}
            >
              {emoji}
            </button>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto"
            onClick={() => setShowEmojiPicker(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-1 md:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-gray-500 flex-shrink-0"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-gray-500 flex-shrink-0"
          onClick={() => setShowAttachments(!showAttachments)}
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            disabled={disabled}
            className="w-full px-3 md:px-4 py-2 rounded-lg bg-white dark:bg-[#2A3942] border-0 focus:outline-none focus:ring-2 focus:ring-[#25D366] text-foreground text-sm md:text-base"
          />
        </div>

        {message.trim() ? (
          <Button
            type="button"
            size="icon"
            className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full flex-shrink-0"
            onClick={handleSend}
            disabled={disabled || isSending}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-gray-500 flex-shrink-0"
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MessageStatus, type MessageStatusType } from './message-status';
import { ReactionBadge } from './reaction-badge';
import { ReactionPicker } from './reaction-picker';
import { Smile, Reply, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/atoms/button';

export interface Message {
  id: string;
  content: string;
  timestamp: Date | string | number;
  status?: MessageStatusType;
  reactions?: Array<{
    emoji: string;
    count: number;
    reacted: boolean;
  }>;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
}

export interface MessageBubbleProps {
  message: Message;
  isOwn?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  className?: string;
}

export const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      message,
      isOwn = false,
      showStatus = true,
      showActions = true,
      onReact,
      onReply,
      className,
    },
    ref
  ) => {
    const [showReactionPicker, setShowReactionPicker] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col max-w-[75%] group relative',
          isOwn ? 'self-end items-end' : 'self-start items-start',
          className
        )}
      >
        {/* Reply preview */}
        {message.reply_to && (
          <div
            className={cn(
              'mb-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border-l-2 border-[#25D366] text-xs text-gray-600 dark:text-gray-400 max-w-full',
              isOwn ? 'rounded-br-none' : 'rounded-bl-none'
            )}
          >
            <p className="font-medium text-[#25D366] truncate">
              {message.reply_to.sender_name}
            </p>
            <p className="truncate">{message.reply_to.content}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl shadow-sm relative',
            'text-sm whitespace-pre-wrap break-words',
            isOwn
              ? 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 rounded-br-md'
              : 'bg-muted dark:bg-muted/50 text-foreground rounded-bl-md'
          )}
        >
          {message.content}

          {/* Action buttons on hover */}
          {showActions && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                isOwn ? '-left-16' : '-right-16'
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <Smile className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow"
                onClick={onReply}
              >
                <Reply className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          )}

          {/* Reaction picker */}
          {showReactionPicker && (
            <ReactionPicker
              onSelect={(emoji) => {
                onReact?.(emoji);
                setShowReactionPicker(false);
              }}
              onClose={() => setShowReactionPicker(false)}
              position={isOwn ? 'top' : 'bottom'}
              className={isOwn ? 'right-0' : 'left-0'}
            />
          )}
        </div>

        {/* Timestamp and status */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 px-1',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isOwn && 'flex-row-reverse'
          )}
        >
          {showStatus && isOwn && message.status && (
            <MessageStatus status={message.status} timestamp={message.timestamp} />
          )}
          {!isOwn && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap gap-1 mt-1',
              isOwn && 'justify-end'
            )}
          >
            {message.reactions.map((reaction, index) => (
              <ReactionBadge
                key={index}
                emoji={reaction.emoji}
                count={reaction.count}
                reacted={reaction.reacted}
                onClick={() => onReact?.(reaction.emoji)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;

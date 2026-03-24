"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MessageStatus, type MessageStatusType } from "./message-status"
import { ReactionBadge } from "./reaction-badge"

export interface Message {
  id: string
  content: string
  timestamp: Date | string | number
  status?: MessageStatusType
  reactions?: Array<{
    emoji: string
    count: number
    reacted: boolean
  }>
}

export interface MessageBubbleProps {
  message: Message
  isOwn?: boolean
  showStatus?: boolean
  className?: string
}

export const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, isOwn = false, showStatus = true, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col max-w-[75%] group",
          isOwn ? "self-end items-end" : "self-start items-start",
          className
        )}
      >
        <div
          className={cn(
            "px-3 py-2 rounded-2xl shadow-sm",
            "text-sm whitespace-pre-wrap break-words",
            isOwn
              ? "bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 rounded-br-md"
              : "bg-muted dark:bg-muted/50 text-foreground rounded-bl-md",
          )}
        >
          {message.content}
        </div>
        
        <div 
          className={cn(
            "flex items-center gap-2 mt-1 px-1",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isOwn && "flex-row-reverse"
          )}
        >
          {showStatus && isOwn && message.status && (
            <MessageStatus 
              status={message.status} 
              timestamp={message.timestamp} 
            />
          )}
          {!isOwn && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          )}
        </div>
        
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-1",
            isOwn && "justify-end"
          )}>
            {message.reactions.map((reaction, index) => (
              <ReactionBadge
                key={index}
                emoji={reaction.emoji}
                count={reaction.count}
                reacted={reaction.reacted}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)

MessageBubble.displayName = "MessageBubble"

export default MessageBubble

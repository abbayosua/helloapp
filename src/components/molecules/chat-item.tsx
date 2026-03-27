"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UserAvatar, type User } from "./user-avatar"
import { Timestamp } from "@/components/atoms/timestamp"

export interface Conversation {
  id: string
  name: string | null
  avatar?: string | null
  isOnline?: boolean
  lastMessage?: {
    content: string
    timestamp: Date | string | number
    isRead?: boolean
    senderName?: string
  }
  unreadCount?: number
  isGroup?: boolean
}

export interface ChatItemProps {
  conversation: Conversation
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export const ChatItem = React.forwardRef<HTMLDivElement, ChatItemProps>(
  ({ conversation, isActive = false, onClick, className }, ref) => {
    const truncateText = (text: string, maxLength: number = 35) => {
      if (text.length <= maxLength) return text
      return text.slice(0, maxLength) + "..."
    }

    const displayName = conversation.name || "Unknown"

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-colors",
          "hover:bg-muted/50 dark:hover:bg-muted/30",
          "rounded-lg",
          isActive && "bg-primary/10 dark:bg-primary/20",
          className
        )}
      >
        <UserAvatar 
          user={{
            id: conversation.id,
            name: displayName,
            avatar: conversation.avatar,
            isOnline: conversation.isOnline,
          }}
          size="lg"
          showStatus={!conversation.isGroup}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "font-medium truncate",
              conversation.unreadCount && conversation.unreadCount > 0 && "font-semibold"
            )}>
              {displayName}
            </span>
            {conversation.lastMessage && (
              <Timestamp 
                time={conversation.lastMessage.timestamp} 
                format="relative"
                className={cn(
                  "text-xs shrink-0",
                  conversation.unreadCount && conversation.unreadCount > 0 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground"
                )}
              />
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className={cn(
              "text-sm truncate",
              conversation.lastMessage?.isRead 
                ? "text-muted-foreground" 
                : "text-foreground"
            )}>
              {conversation.lastMessage?.senderName && (
                <span className="font-medium">
                  {conversation.lastMessage.senderName}:{" "}
                </span>
              )}
              {conversation.lastMessage?.content 
                ? truncateText(conversation.lastMessage.content)
                : "No messages yet"}
            </span>
            
            {conversation.unreadCount && conversation.unreadCount > 0 && (
              <Badge 
                variant="default"
                className="rounded-full px-2 py-0.5 text-[10px] min-w-[20px] h-5 flex items-center justify-center"
              >
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    )
  }
)

ChatItem.displayName = "ChatItem"

export default ChatItem

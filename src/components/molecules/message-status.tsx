"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/atoms/icon"
import { Timestamp } from "@/components/atoms/timestamp"

export type MessageStatusType = "sending" | "sent" | "delivered" | "read"

export interface MessageStatusProps {
  status: MessageStatusType
  timestamp?: Date | string | number
  showText?: boolean
  className?: string
}

const statusConfig = {
  sending: {
    icon: "clock" as const,
    color: "text-muted-foreground",
    text: "Sending...",
  },
  sent: {
    icon: "check" as const,
    color: "text-muted-foreground",
    text: "Sent",
  },
  delivered: {
    icon: "checkCheck" as const,
    color: "text-muted-foreground",
    text: "Delivered",
  },
  read: {
    icon: "checkCheck" as const,
    color: "text-blue-500",
    text: "Read",
  },
}

export const MessageStatus = React.forwardRef<HTMLDivElement, MessageStatusProps>(
  ({ status, timestamp, showText = false, className }, ref) => {
    const config = statusConfig[status]

    return (
      <div 
        ref={ref} 
        className={cn("flex items-center gap-1", className)}
      >
        {timestamp && (
          <Timestamp time={timestamp} format="short" className="text-[10px]" />
        )}
        <span className={cn("flex items-center", config.color)}>
          <Icon name={config.icon} size="xs" />
        </span>
        {showText && (
          <span className={cn("text-xs", config.color)}>
            {config.text}
          </span>
        )}
      </div>
    )
  }
)

MessageStatus.displayName = "MessageStatus"

export default MessageStatus

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { UserAvatar, type User } from "./user-avatar"

export interface TypingIndicatorProps {
  user: User
  className?: string
}

export const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ user, className }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
          "dark:bg-muted/30",
          className
        )}
      >
        <UserAvatar user={user} size="sm" showStatus={false} />
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground mr-1">
            {user.name} is typing
          </span>
          <div className="flex gap-1">
            <span 
              className="size-2 rounded-full bg-foreground/60 animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
            />
            <span 
              className="size-2 rounded-full bg-foreground/60 animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
            />
            <span 
              className="size-2 rounded-full bg-foreground/60 animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
            />
          </div>
        </div>
      </div>
    )
  }
)

TypingIndicator.displayName = "TypingIndicator"

export default TypingIndicator

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ReactionBadgeProps {
  emoji: string
  count?: number
  reacted?: boolean
  onClick?: () => void
  className?: string
}

export const ReactionBadge = React.forwardRef<HTMLButtonElement, ReactionBadgeProps>(
  ({ emoji, count, reacted = false, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
          "text-xs transition-colors",
          "border border-border/50",
          "hover:bg-muted/50 dark:hover:bg-muted/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          reacted 
            ? "bg-primary/10 border-primary/50 dark:bg-primary/20" 
            : "bg-muted/30 dark:bg-muted/20",
          className
        )}
      >
        <span className="text-sm">{emoji}</span>
        {count !== undefined && count > 1 && (
          <span className="text-muted-foreground font-medium">
            {count}
          </span>
        )}
      </button>
    )
  }
)

ReactionBadge.displayName = "ReactionBadge"

export default ReactionBadge

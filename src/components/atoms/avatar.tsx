"use client"

import * as React from "react"
import { Avatar as UIAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { OnlineIndicator } from "./online-indicator"

export type AvatarSize = "sm" | "md" | "lg" | "xl"

export interface AvatarProps {
  /** Image source URL */
  src?: string | null
  /** Alt text for accessibility */
  alt?: string
  /** User name for fallback initials */
  name?: string
  /** Size variant */
  size?: AvatarSize
  /** Whether to show online status indicator */
  showStatus?: boolean
  /** Online status */
  isOnline?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
}

const statusPositionClasses: Record<AvatarSize, string> = {
  sm: "bottom-0 right-0",
  md: "bottom-0 right-0",
  lg: "bottom-0.5 right-0.5",
  xl: "bottom-1 right-1",
}

/**
 * Get initials from a name
 * @param name - Full name
 * @returns 1-2 character initials
 */
function getInitials(name: string): string {
  if (!name) return "?"
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Avatar component with fallback initials and optional online status indicator
 * WhatsApp-style circular avatar
 */
export function Avatar({
  src,
  alt,
  name,
  size = "md",
  showStatus = false,
  isOnline = false,
  className,
}: AvatarProps) {
  const initials = name ? getInitials(name) : "?"
  
  return (
    <div className={cn("relative inline-block", className)}>
      <UIAvatar 
        className={cn(
          sizeClasses[size],
          "ring-2 ring-background dark:ring-card"
        )}
      >
        {src && (
          <AvatarImage 
            src={src} 
            alt={alt || name || "User avatar"} 
          />
        )}
        <AvatarFallback 
          className={cn(
            "bg-muted text-muted-foreground font-medium",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            size === "xl" && "text-lg"
          )}
        >
          {initials}
        </AvatarFallback>
      </UIAvatar>
      
      {showStatus && (
        <div className={cn(
          "absolute",
          statusPositionClasses[size]
        )}>
          <OnlineIndicator isOnline={isOnline} size={size} />
        </div>
      )}
    </div>
  )
}

export { Avatar as AvatarAtom }

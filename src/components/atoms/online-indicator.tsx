"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type IndicatorSize = "sm" | "md" | "lg" | "xl"

export interface OnlineIndicatorProps {
  /** Whether the user is online */
  isOnline: boolean
  /** Size variant */
  size?: IndicatorSize
  /** Additional CSS classes */
  className?: string
}

const sizeClasses: Record<IndicatorSize, string> = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
  xl: "size-3.5",
}

// WhatsApp green color
const ONLINE_COLOR = "#25D366"

/**
 * Online indicator component
 * Shows a green dot when user is online, gray dot when offline
 * WhatsApp-style status indicator
 */
export function OnlineIndicator({
  isOnline,
  size = "md",
  className,
}: OnlineIndicatorProps) {
  return (
    <span
      className={cn(
        "rounded-full ring-2 ring-background dark:ring-card",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: isOnline ? ONLINE_COLOR : "#9CA3AF",
      }}
      aria-label={isOnline ? "Online" : "Offline"}
      role="status"
    />
  )
}

/**
 * Text status indicator with label
 */
export function OnlineStatusLabel({ 
  isOnline,
  className 
}: { 
  isOnline: boolean
  className?: string 
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <OnlineIndicator isOnline={isOnline} size="sm" />
      <span className={cn(
        "text-xs",
        isOnline ? "text-[#25D366]" : "text-muted-foreground"
      )}>
        {isOnline ? "online" : "offline"}
      </span>
    </div>
  )
}

export { OnlineIndicator as OnlineIndicatorAtom }

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  format, 
  isToday, 
  isYesterday, 
  isThisWeek,
  isThisYear 
} from "date-fns"

export type TimestampFormat = "short" | "long" | "relative" | "time"

export interface TimestampProps {
  /** Date to format */
  date: Date | string | number
  /** Format variant */
  format?: TimestampFormat
  /** Additional CSS classes */
  className?: string
  /** Show relative time for recent dates */
  showRelative?: boolean
}

/**
 * Format a timestamp based on the specified format
 */
function formatTimestamp(
  date: Date, 
  formatType: TimestampFormat,
  showRelative: boolean
): string {
  // If relative mode is enabled and it's recent
  if (showRelative || formatType === "relative") {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    // Less than 1 minute ago
    if (diffMinutes < 1) {
      return "now"
    }
    
    // Less than 1 hour ago
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    }
    
    // Less than 24 hours ago
    if (diffMinutes < 60 * 24) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours}h ago`
    }
  }
  
  // Today - show time only
  if (isToday(date)) {
    return format(date, "h:mm a")
  }
  
  // Yesterday
  if (isYesterday(date)) {
    return "Yesterday"
  }
  
  // This week - show day name
  if (isThisWeek(date)) {
    return format(date, "EEEE")
  }
  
  // This year - show month and day
  if (isThisYear(date)) {
    return formatType === "long" 
      ? format(date, "MMMM d") 
      : format(date, "MMM d")
  }
  
  // Older - show full date
  return formatType === "long" 
    ? format(date, "MMMM d, yyyy") 
    : format(date, "MM/dd/yy")
}

/**
 * Format time for message timestamps
 */
function formatTime(date: Date): string {
  return format(date, "h:mm a")
}

/**
 * Timestamp component for displaying formatted dates and times
 * WhatsApp-style timestamp formatting
 */
export function Timestamp({
  date,
  format: formatType = "relative",
  className,
  showRelative = true,
}: TimestampProps) {
  // Parse date if string
  let parsedDate: Date
  if (typeof date === "string" || typeof date === "number") {
    parsedDate = new Date(date)
  } else {
    parsedDate = date
  }
  
  // Format the timestamp
  let formatted: string
  if (formatType === "time") {
    formatted = formatTime(parsedDate)
  } else {
    formatted = formatTimestamp(parsedDate, formatType, showRelative)
  }
  
  // Full date for tooltip
  const fullDate = format(parsedDate, "PPpp")
  
  return (
    <time
      className={cn(
        "text-xs text-muted-foreground",
        className
      )}
      dateTime={parsedDate.toISOString()}
      title={fullDate}
    >
      {formatted}
    </time>
  )
}

/**
 * Message timestamp with additional context
 */
export function MessageTimestamp({ 
  date,
  showCheckmark = false,
  className 
}: { 
  date: Date | string | number
  showCheckmark?: boolean
  className?: string 
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Timestamp date={date} format="time" />
      {showCheckmark && (
        <span className="text-[#53bdeb] text-xs">✓✓</span>
      )}
    </div>
  )
}

export { Timestamp as TimestampAtom }

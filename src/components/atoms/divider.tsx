"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type DividerOrientation = "horizontal" | "vertical"

export interface DividerProps {
  /** Orientation of the divider */
  orientation?: DividerOrientation
  /** Optional label text */
  label?: string
  /** Additional CSS classes */
  className?: string
  /** Decorative (no semantic meaning) or semantic separator */
  decorative?: boolean
}

/**
 * Divider component for separating content sections
 * Supports horizontal and vertical orientations with optional label
 */
export function Divider({
  orientation = "horizontal",
  label,
  className,
  decorative = true,
}: DividerProps) {
  // With label - horizontal only
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Separator className="flex-1" decorative={decorative} />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {label}
        </span>
        <Separator className="flex-1" decorative={decorative} />
      </div>
    )
  }
  
  // Vertical divider
  if (orientation === "vertical") {
    return (
      <Separator
        orientation="vertical"
        decorative={decorative}
        className={cn("h-auto self-stretch", className)}
      />
    )
  }
  
  // Horizontal divider
  return (
    <Separator
      orientation="horizontal"
      decorative={decorative}
      className={className}
    />
  )
}

/**
 * Date divider for chat messages
 * Shows date label centered between two lines
 */
export function DateDivider({ 
  date,
  className 
}: { 
  date: Date | string
  className?: string 
}) {
  const parsedDate = typeof date === "string" ? new Date(date) : date
  
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  let label: string
  if (parsedDate.toDateString() === today.toDateString()) {
    label = "Today"
  } else if (parsedDate.toDateString() === yesterday.toDateString()) {
    label = "Yesterday"
  } else {
    label = parsedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }
  
  return (
    <Divider 
      label={label} 
      className={cn("my-4", className)} 
    />
  )
}

/**
 * Section divider with styling for content grouping
 */
export function SectionDivider({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <Divider 
      className={cn("my-6", className)} 
    />
  )
}

export { Divider as DividerAtom }

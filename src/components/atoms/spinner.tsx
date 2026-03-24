"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export type SpinnerSize = "sm" | "md" | "lg"

export interface SpinnerProps {
  /** Size variant */
  size?: SpinnerSize
  /** Additional CSS classes */
  className?: string
  /** Accessible label for screen readers */
  ariaLabel?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

/**
 * Spinner component for loading states
 * Uses Lucide's Loader2 icon with animation
 */
export function Spinner({
  size = "md",
  className,
  ariaLabel = "Loading",
}: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-current",
        sizeClasses[size],
        className
      )}
      aria-label={ariaLabel}
      role="status"
    />
  )
}

/**
 * Full page loading spinner with centered layout
 */
export function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-[200px] w-full",
      className
    )}>
      <Spinner size="lg" ariaLabel="Loading page" />
    </div>
  )
}

/**
 * Inline loading spinner with text
 */
export function LoadingText({ 
  text = "Loading...",
  className 
}: { 
  text?: string
  className?: string 
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-muted-foreground",
      className
    )}>
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export { Spinner as SpinnerAtom }

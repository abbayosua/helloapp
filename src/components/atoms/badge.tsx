"use client"

import * as React from "react"
import { Badge as UIBadge, badgeVariants as uiBadgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Extended badge variants with WhatsApp-specific styles
const extendedBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "text-white",
        warning: "bg-yellow-500 text-white",
        destructive: "bg-destructive text-white",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-background text-foreground",
        muted: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "min-w-4 h-4 text-[10px] px-1",
        md: "min-w-5 h-5 text-xs px-1.5",
        lg: "min-w-6 h-6 text-sm px-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export type BadgeVariant = VariantProps<typeof extendedBadgeVariants>["variant"]
export type BadgeSize = VariantProps<typeof extendedBadgeVariants>["size"]

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge style variant */
  variant?: BadgeVariant
  /** Badge size */
  badgeSize?: BadgeSize
  /** Additional CSS classes */
  className?: string
}

// WhatsApp green color for success variant
const WHATSAPP_GREEN = "#25D366"

/**
 * Badge component for unread counts, status indicators
 * Supports WhatsApp-themed variants
 */
export function Badge({
  variant = "default",
  badgeSize = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  // Apply WhatsApp green for success variant
  const successStyle = variant === "success" 
    ? { backgroundColor: WHATSAPP_GREEN } 
    : undefined
  
  return (
    <span
      className={cn(
        extendedBadgeVariants({ variant, size: badgeSize }),
        className
      )}
      style={successStyle}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Unread count badge specifically for message counts
 * Caps display at 99+
 */
export function UnreadBadge({ 
  count, 
  className,
  ...props 
}: { count: number } & Omit<BadgeProps, "children">) {
  if (count <= 0) return null
  
  const displayCount = count > 99 ? "99+" : count
  
  return (
    <Badge 
      variant="success" 
      badgeSize="sm" 
      className={cn("font-semibold", className)}
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

export { Badge as BadgeAtom, extendedBadgeVariants as badgeVariants }

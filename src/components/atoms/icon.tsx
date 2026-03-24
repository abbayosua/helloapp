"use client"

import * as React from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

export type IconName = keyof typeof LucideIcons

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl"

export interface IconProps {
  /** Name of the Lucide icon */
  name: IconName
  /** Size variant */
  size?: IconSize
  /** Additional CSS classes */
  className?: string
  /** Accessibility label */
  ariaLabel?: string
}

const sizeClasses: Record<IconSize, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
}

/**
 * Icon component that maps string names to Lucide icons
 * Useful for dynamic icon rendering based on data
 */
export function Icon({
  name,
  size = "md",
  className,
  ariaLabel,
}: IconProps) {
  // Get the icon component from Lucide
  const IconComponent = LucideIcons[name] as React.ComponentType<LucideIcons.LucideProps>
  
  // Handle case where icon doesn't exist
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`)
    return null
  }
  
  return (
    <IconComponent
      className={cn(sizeClasses[size], className)}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  )
}

/**
 * Commonly used icon names for WhatsApp-style UI
 * Export these for easy access and type safety
 */
export const COMMON_ICONS = {
  // Navigation
  HOME: "Home" as IconName,
  SEARCH: "Search" as IconName,
  SETTINGS: "Settings" as IconName,
  MENU: "Menu" as IconName,
  
  // Communication
  MESSAGE: "MessageCircle" as IconName,
  SEND: "Send" as IconName,
  PHONE: "Phone" as IconName,
  VIDEO: "Video" as IconName,
  
  // Status
  CHECK: "Check" as IconName,
  CHECK_CHECK: "CheckCheck" as IconName,
  
  // Media
  IMAGE: "Image" as IconName,
  FILE: "File" as IconName,
  PAPERCLIP: "Paperclip" as IconName,
  
  // Actions
  PLUS: "Plus" as IconName,
  X: "X" as IconName,
  EDIT: "Edit" as IconName,
  TRASH: "Trash2" as IconName,
  
  // Emoji
  SMILE: "Smile" as IconName,
  MIC: "Mic" as IconName,
} as const

export { Icon as IconAtom }

"use client"

import * as React from "react"
import { Button as UIButton, buttonVariants as uiButtonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Spinner } from "./spinner"

// WhatsApp color palette
const WHATSAPP_COLORS = {
  primary: "#25D366",
  darkGreen: "#128C7E",
  teal: "#075E54",
}

// Extended button variants with WhatsApp-specific styles
const extendedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:ring-primary/50",
        primary: "text-white shadow-xs hover:opacity-90 focus-visible:ring-[#25D366]/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
      },
      size: {
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export type ButtonVariant = VariantProps<typeof extendedButtonVariants>["variant"]
export type ButtonSize = VariantProps<typeof extendedButtonVariants>["size"]

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Show loading spinner */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
  /** Render as child component */
  asChild?: boolean
}

/**
 * Button component with WhatsApp-themed variants
 * Supports loading state with spinner
 */
export function Button({
  variant = "default",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  asChild,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  
  // Apply WhatsApp green for primary variant
  const primaryStyle = variant === "primary" 
    ? { backgroundColor: WHATSAPP_COLORS.primary } 
    : undefined
  
  return (
    <button
      className={cn(
        extendedButtonVariants({ variant, size }),
        className
      )}
      style={primaryStyle}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  )
}

// Export buttonVariants for use in other components
export { extendedButtonVariants as buttonVariants }
export { Button as ButtonAtom }

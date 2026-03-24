"use client"

import * as React from "react"
import { Input as UIInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label text for the input */
  label?: string
  /** Error message to display */
  error?: string
  /** Optional icon to display on the left */
  icon?: LucideIcon
  /** Input size variant */
  inputSize?: "sm" | "md" | "lg"
  /** Additional CSS classes for the container */
  containerClassName?: string
}

const sizeClasses = {
  sm: "h-8 text-sm",
  md: "h-9 text-sm",
  lg: "h-11 text-base",
}

/**
 * Input component with label, error state, and optional icon
 * Built on top of shadcn/ui Input
 */
export function Input({
  label,
  error,
  icon: Icon,
  inputSize = "md",
  className,
  containerClassName,
  id,
  ...props
}: InputProps) {
  const generatedId = React.useId()
  const inputId = id || generatedId
  const hasError = !!error
  
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <Label 
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium",
            hasError && "text-destructive"
          )}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <UIInput
          id={inputId}
          className={cn(
            sizeClasses[inputSize],
            Icon && "pl-9",
            hasError && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p 
          id={`${inputId}-error`}
          className="text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export { Input as InputAtom }

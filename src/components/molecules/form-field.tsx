"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon, type IconName, type LucideIcon } from "@/components/atoms/icon"

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string
  name: string
  error?: string
  icon?: IconName | LucideIcon
  className?: string
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    name, 
    error, 
    icon,
    type = "text", 
    placeholder, 
    required = false,
    className,
    ...props 
  }, ref) => {
    const inputId = React.useId()
    const errorId = `${inputId}-error`
    
    return (
      <div className={cn("space-y-2", className)}>
        <Label 
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {typeof icon === 'string' ? (
                <Icon name={icon} size="sm" />
              ) : (
                <Icon icon={icon} size="sm" />
              )}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              icon && "pl-10",
              error && "border-destructive focus-visible:ring-destructive/50"
            )}
            {...props}
          />
        </div>
        {error && (
          <p 
            id={errorId}
            className="text-sm text-destructive flex items-center gap-1"
          >
            <Icon name="alertCircle" size="xs" />
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

export default FormField

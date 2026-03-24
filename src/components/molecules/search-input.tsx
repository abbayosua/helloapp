"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/atoms/icon"

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  containerClassName?: string
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    value = "", 
    onChange, 
    onClear,
    placeholder = "Search or start new chat", 
    className,
    containerClassName,
    ...props 
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    const handleClear = () => {
      onChange?.("")
      onClear?.()
    }

    return (
      <div className={cn("relative", containerClassName)}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icon name="search" size="sm" />
        </div>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-8 h-10 rounded-lg bg-muted/50 border-transparent",
            "focus-visible:ring-1 focus-visible:ring-primary/50",
            "placeholder:text-muted-foreground",
            "dark:bg-muted/30 dark:focus-visible:ring-primary/30",
            className
          )}
          {...props}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
            onClick={handleClear}
          >
            <Icon name="x" size="sm" className="text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"

export default SearchInput

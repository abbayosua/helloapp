"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Icon, type IconName, type LucideIcon } from "@/components/atoms/icon"

export interface MenuItemProps {
  icon?: IconName | LucideIcon
  label: string
  badge?: number | string
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ icon, label, badge, isActive = false, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-lg",
          "text-sm font-medium transition-colors",
          "hover:bg-muted/50 dark:hover:bg-muted/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-primary/10 text-primary dark:bg-primary/20",
          className
        )}
      >
        {icon && (
          <span className="text-muted-foreground">
            {typeof icon === 'string' ? (
              <Icon name={icon} size="md" />
            ) : (
              <Icon icon={icon} size="md" />
            )}
          </span>
        )}
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && (
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className="rounded-full px-2 py-0.5 text-[10px] min-w-[20px] h-5 flex items-center justify-center"
          >
            {badge}
          </Badge>
        )}
      </button>
    )
  }
)

MenuItem.displayName = "MenuItem"

export default MenuItem

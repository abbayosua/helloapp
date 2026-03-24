"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { OnlineIndicator } from "@/components/atoms/online-indicator"

export interface User {
  id: string
  name: string
  avatar?: string | null
  isOnline?: boolean
}

export interface UserAvatarProps {
  user: User
  size?: "sm" | "md" | "lg" | "xl"
  showStatus?: boolean
  className?: string
}

const sizeMap = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
} as const

const statusSizeMap = {
  sm: "sm" as const,
  md: "sm" as const,
  lg: "md" as const,
  xl: "lg" as const,
}

export const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  ({ user, size = "md", showStatus = true, className }, ref) => {
    const initials = React.useMemo(() => {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }, [user.name])

    return (
      <div ref={ref} className={cn("relative inline-block", className)}>
        <Avatar className={cn(sizeMap[size])}>
          {user.avatar && (
            <AvatarImage 
              src={user.avatar} 
              alt={user.name}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {showStatus && (
          <OnlineIndicator 
            isOnline={user.isOnline} 
            size={statusSizeMap[size]} 
          />
        )}
      </div>
    )
  }
)

UserAvatar.displayName = "UserAvatar"

export default UserAvatar

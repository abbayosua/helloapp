/**
 * Atoms - The smallest UI components
 * 
 * These are the basic building blocks of the UI.
 * Each atom serves a single purpose and is highly reusable.
 */

// Avatar
export { Avatar, AvatarAtom } from "./avatar"
export type { AvatarProps, AvatarSize } from "./avatar"

// Button
export { Button, ButtonAtom, buttonVariants } from "./button"
export type { ButtonProps, ButtonVariant, ButtonSize } from "./button"

// Input
export { Input, InputAtom } from "./input"
export type { InputProps } from "./input"

// Icon
export { Icon, IconAtom, COMMON_ICONS } from "./icon"
export type { IconProps, IconName, IconSize } from "./icon"

// Badge
export { Badge, BadgeAtom, badgeVariants, UnreadBadge } from "./badge"
export type { BadgeProps, BadgeVariant, BadgeSize } from "./badge"

// Spinner
export { Spinner, SpinnerAtom, PageSpinner, LoadingText } from "./spinner"
export type { SpinnerProps, SpinnerSize } from "./spinner"

// Online Indicator
export { OnlineIndicator, OnlineIndicatorAtom, OnlineStatusLabel } from "./online-indicator"
export type { OnlineIndicatorProps, IndicatorSize } from "./online-indicator"

// Timestamp
export { Timestamp, TimestampAtom, MessageTimestamp } from "./timestamp"
export type { TimestampProps, TimestampFormat } from "./timestamp"

// Divider
export { Divider, DividerAtom, DateDivider, SectionDivider } from "./divider"
export type { DividerProps, DividerOrientation } from "./divider"

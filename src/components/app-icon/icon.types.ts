import type { ComponentProps } from "react"
import type { HugeiconsIcon } from "@hugeicons/react"

export type AppIconSize = "xs" | "sm" | "md" | "lg" | "xl"

export type HugeiconData = ComponentProps<typeof HugeiconsIcon>["icon"]

export type AppIconName =
  | "database"
  | "calculator"
  | "cpu"
  | "network"
  | "coffee"
  | "pause"
  | "play"
  | "flag"
  | "hint"
  | "keyboard"
  | "search"
  | "close"
  | "check"
  | "check-circle"
  | "alert"
  | "alert-circle"
  | "info"
  | "help"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "arrow-down"
  | "arrow-up"
  | "arrow-left"
  | "arrow-right"
  | "calendar"
  | "clock"
  | "user"
  | "settings"
  | "code"
  | "book"
  | "folder"
  | "file"
  | "plus"
  | "minus"
  | "edit"
  | "trash"
  | "copy"
  | "external-link"
  | "filter"
  | "sort"
  | "eye"
  | "eye-off"
  | "star"
  | "sparkles"
  | "bookmark"
  | "bell"
  | "moon"
  | "sun"
  | "system"
  | "menu"
  | "more-horizontal"
  | "more-vertical"
  | "spinner"
  | "shield"
  | "lock"
  | "save"
  | "logout"
  | "exit"
  | "dashboard"
  | "target"
  | "chart"
  | "building"
  | "flame"
  | "sidebar"
  | "sidebar-close"
  | "sidebar-open"
  | "volume-high"
  | "volume-mute"

export interface AppIconProps extends Omit<ComponentProps<typeof HugeiconsIcon>, "icon" | "size"> {
  /**
   * Predefined semantic icon key or direct Hugeicon definition
   */
  icon: AppIconName | HugeiconData
  /**
   * Semantic size preset or custom numeric pixel value
   * xs: 12px | sm: 16px | md: 20px | lg: 24px | xl: 32px
   */
  size?: AppIconSize | number
  /**
   * Accessible text when icon represents an action without visible text
   */
  label?: string
}

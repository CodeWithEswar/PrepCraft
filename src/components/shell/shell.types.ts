import type { ReactNode } from "react"
import type { AppIconName } from "@/components/app-icon"

export interface ShellNavItem {
  label: string
  href: string
  icon: AppIconName
}
export interface ShellNavGroup {
  label: string
  icon: AppIconName
  items: ShellNavItem[]
}
export interface AppShellProps {
  children: ReactNode
  navigation: ShellNavGroup[]
  dashboardHref: string
  settingsHref: string
  workspaceName: string
  userName?: string
  workspaceControl?: ReactNode
  notificationControl?: ReactNode
  profileAction?: ReactNode
  preview?: boolean
  archived?: boolean
}

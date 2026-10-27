"use client"
import * as React from "react"
import { getWorkspaceInitials, getWorkspaceMarkStyle } from "../utils/workspace-avatar"
import { cn } from "cn"

interface WorkspaceAvatarProps {
  name: string
  id?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function WorkspaceAvatar({
  name,
  id,
  size = "md",
  className,
}: WorkspaceAvatarProps) {
  const initials = getWorkspaceInitials(name)
  const style = getWorkspaceMarkStyle(id || name)

  const sizeClasses = {
    sm: "h-7 w-7 text-[11px] rounded-lg",
    md: "h-9 w-9 text-xs rounded-xl",
    lg: "h-12 w-12 text-sm rounded-2xl",
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tracking-tight border select-none transition-colors",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

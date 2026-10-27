import * as React from "react"
import { Badge } from "@/components/ui/badge"
import type { CurriculumPriority, TemplateType } from "../types/template.types"

interface PriorityBadgeProps {
  priority: CurriculumPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  switch (priority) {
    case "core":
      return (
        <Badge
          variant="outline"
          className={`border-[#A15F4B]/40 bg-[#A15F4B]/15 text-[#A15F4B] dark:text-[#E2A999] font-medium text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md ${className || ""}`}
        >
          Core Focus
        </Badge>
      )
    case "high":
      return (
        <Badge
          variant="outline"
          className={`border-[#A15F4B]/30 bg-[#A15F4B]/10 text-[#A15F4B] dark:text-[#E2A999] text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md ${className || ""}`}
        >
          High
        </Badge>
      )
    case "medium":
      return (
        <Badge
          variant="outline"
          className={`border-border/60 bg-surface-elevated/40 text-foreground/80 text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md ${className || ""}`}
        >
          Medium
        </Badge>
      )
    case "low":
      return (
        <Badge
          variant="outline"
          className={`border-border/40 bg-muted/30 text-muted-foreground text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md ${className || ""}`}
        >
          Low
        </Badge>
      )
    case "optional":
      return (
        <Badge
          variant="outline"
          className={`border-dashed border-border/60 bg-transparent text-muted-foreground/80 text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md ${className || ""}`}
        >
          Optional
        </Badge>
      )
    default:
      return null
  }
}

interface TemplateTypeBadgeProps {
  type: TemplateType
  className?: string
}

export function TemplateTypeBadge({ type, className }: TemplateTypeBadgeProps) {
  let label = "General"
  switch (type) {
    case "company_role":
      label = "Company + Role"
      break
    case "company":
      label = "Company Focus"
      break
    case "role":
      label = "Role Curriculum"
      break
    case "general":
      label = "General Curriculum"
      break
    case "custom":
      label = "Custom Curriculum"
      break
  }

  return (
    <span
      className={`inline-flex items-center text-[11px] font-mono tracking-tight text-muted-foreground bg-surface-elevated/50 border border-border/40 px-2 py-0.5 rounded ${className || ""}`}
    >
      {label}
    </span>
  )
}

interface VersionBadgeProps {
  versionNumber: number
  isPinned?: boolean
  className?: string
}

export function VersionBadge({ versionNumber, isPinned, className }: VersionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
        isPinned
          ? "border-[#A15F4B]/50 bg-[#A15F4B]/10 text-[#A15F4B] dark:text-[#E2A999]"
          : "border-border/60 bg-surface-elevated/40 text-muted-foreground"
      } ${className || ""}`}
    >
      {isPinned ? `Pinned v${versionNumber}` : `v${versionNumber}`}
    </span>
  )
}

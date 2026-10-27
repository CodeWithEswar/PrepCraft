import * as React from "react"
import { Badge } from "@/components/ui/badge"
import type { WorkspaceStatus } from "../types/workspace.types"
import { cn } from "cn"

interface WorkspaceStatusBadgeProps {
  status: WorkspaceStatus
  className?: string
}

export function WorkspaceStatusBadge({ status, className }: WorkspaceStatusBadgeProps) {
  if (status === "archived") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-muted/60 text-muted-foreground border-border/60 text-[11px] font-medium tracking-normal",
          className
        )}
      >
        Archived
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-primary/5 text-primary border-primary/25 text-[11px] font-medium tracking-normal",
        className
      )}
    >
      Active
    </Badge>
  )
}

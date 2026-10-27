import * as React from "react"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"

interface WorkspaceEmptyStateProps {
  onCreateClick?: () => void
}

export function WorkspaceEmptyState({ onCreateClick }: WorkspaceEmptyStateProps) {
  return (
    <Empty className="border border-dashed border-border/80 rounded-2xl p-8 max-w-md mx-auto my-12 bg-card/40">
      <EmptyHeader>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-2">
          <AppIcon icon="folder" size="lg" />
        </div>
        <EmptyTitle className="text-base font-semibold">No preparation workspace yet</EmptyTitle>
        <EmptyDescription className="text-xs sm:text-sm text-muted-foreground">
          Create a workspace to start organizing your target company, role, coding language, and daily study plan.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-4">
        {onCreateClick && (
          <Button onClick={onCreateClick} size="sm" className="gap-2">
            <AppIcon icon="plus" size="sm" />
            Create workspace
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}

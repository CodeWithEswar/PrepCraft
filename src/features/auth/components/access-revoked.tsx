import * as React from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AppIcon } from "@/components/app-icon"

export function AccessRevokedAlert({ workspaceSlug }: { workspaceSlug?: string }) {
  return (
    <Alert className="border-border/80 bg-surface/75 text-foreground text-left">
      <AppIcon icon="alert-circle" size={16} className="text-primary mt-0.5 shrink-0" />
      <div className="flex-1 space-y-0.5">
        <AlertTitle className="text-xs font-semibold">Workspace access changed</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
          {workspaceSlug
            ? `Your membership in "${workspaceSlug}" is no longer active. Sign in to choose an active workspace.`
            : "You no longer have access to this workspace. Sign in to choose an authorized workspace."}
        </AlertDescription>
      </div>
    </Alert>
  )
}

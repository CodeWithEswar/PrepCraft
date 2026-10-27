import * as React from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AppIcon } from "@/components/app-icon"

export function SessionExpiredAlert() {
  return (
    <Alert className="border-border/80 bg-surface/75 text-foreground text-left">
      <AppIcon icon="lock" size={16} className="text-primary mt-0.5 shrink-0" />
      <div className="flex-1 space-y-0.5">
        <AlertTitle className="text-xs font-semibold">Session expired</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
          Your secure session has timed out. Sign in again to resume your preparation.
        </AlertDescription>
      </div>
    </Alert>
  )
}

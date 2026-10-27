import * as React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppIcon } from "@/components/app-icon"
import type { TargetChangeImpact } from "../types/target.types"
import { cn } from "cn"

interface TargetImpactPreviewProps {
  impact: TargetChangeImpact
  className?: string
}

export function TargetImpactPreview({ impact, className }: TargetImpactPreviewProps) {
  return (
    <Alert
      className={cn(
        "border border-border/80 bg-surface-elevated/40 text-foreground py-3 px-4 rounded-xl space-y-1",
        impact.requiresPlanRebalance && "border-primary/30 bg-primary/5",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="text-primary mt-0.5 shrink-0">
          <AppIcon icon="info" size="sm" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-tight text-foreground">
            Schedule & Plan Advisory
          </p>
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
            {impact.advisoryMessage}
          </AlertDescription>
          {impact.daysRemaining !== null && (
            <div className="pt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80 font-mono">
              <span>{impact.daysRemaining} days remaining</span>
              <span>·</span>
              <span>About {impact.weeksRemaining} week{impact.weeksRemaining === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}

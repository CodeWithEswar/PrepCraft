"use client"

import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { ActionResult } from "../server/mutations"
import type { ApplyTemplateInput } from "../schemas/template.schema"
import type { PreparationTemplate, TemplateVersion } from "../types/template.types"

interface ApplyTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  template: PreparationTemplate
  version?: TemplateVersion | null
  currentTemplateName?: string | null
  onApplyAction?: (input: ApplyTemplateInput) => Promise<ActionResult<{ appliedVersionNumber: number }>>
  onSuccess?: () => void
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  workspaceId,
  template,
  version,
  currentTemplateName,
  onApplyAction,
  onSuccess,
}: ApplyTemplateDialogProps) {
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const isReplacing = Boolean(currentTemplateName && currentTemplateName !== template.name)

  const handleApply = () => {
    if (!onApplyAction) return
    setError(null)
    startTransition(async () => {
      const res = await onApplyAction({
        workspaceId,
        templateId: template.id,
        versionNumber: version?.versionNumber,
      })

      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.()
        }, 1000)
      } else {
        setError(res.error || "Failed to apply template")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isReplacing ? "Replace Workspace Curriculum" : "Apply Preparation Template"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isReplacing
              ? `You are switching from ${currentTemplateName} to ${template.name}.`
              : `Initialize your workspace curriculum with ${template.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Summary Box */}
          <div className="rounded-xl border border-border/70 bg-surface-elevated/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{template.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                v{version?.versionNumber || template.currentVersionNumber || 1}
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {template.description}
            </p>
          </div>

          {/* Progress Preservation Guarantee */}
          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="text-[#A15F4B]">
                <AppIcon icon="check" size="xs" />
              </span>
              <span>Work is Never Destroyed</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Existing question attempts, session logs, notes, and revision progress are preserved. The new template establishes recommended focus areas and planning priorities.
            </p>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 flex items-center gap-2">
              <AppIcon icon="check" size="xs" />
              <span>Template applied successfully! Rebuilding curriculum...</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending || success}
            onClick={handleApply}
            className="bg-[#A15F4B] text-white hover:bg-[#8A503E]"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <AppIcon icon="spinner" size="xs" className="animate-spin" />
                Applying...
              </span>
            ) : isReplacing ? (
              "Confirm & Replace"
            ) : (
              "Apply Template"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

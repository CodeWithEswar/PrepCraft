"use client"

import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TemplateDiff } from "./template-diff"
import type { ActionResult } from "../server/mutations"
import type { UpgradeTemplateInput } from "../schemas/template.schema"
import type { TemplateUpgradeAvailability, CurriculumDiff } from "../types/template.types"

interface TemplateUpdateBannerProps {
  workspaceId: string
  templateId: string
  templateName: string
  upgrade: TemplateUpgradeAvailability
  diff: CurriculumDiff | null
  onUpgradeAction?: (input: UpgradeTemplateInput) => Promise<ActionResult<{ upgradedVersionNumber: number }>>
}

export function TemplateUpdateBanner({
  workspaceId,
  templateId,
  templateName,
  upgrade,
  diff,
  onUpgradeAction,
}: TemplateUpdateBannerProps) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  if (!upgrade.available) return null

  const handleUpgrade = () => {
    if (!onUpgradeAction) return
    setError(null)
    startTransition(async () => {
      const res = await onUpgradeAction({
        workspaceId,
        templateId,
        newVersionNumber: upgrade.latestVersionNumber,
      })

      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
        }, 1200)
      } else {
        setError(res.error || "Failed to upgrade template version")
      }
    })
  }

  return (
    <>
      <div className="rounded-xl border border-[#A15F4B]/30 bg-[#A15F4B]/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <span className="text-[#A15F4B] mt-0.5 shrink-0">
            <AppIcon icon="sparkles" size="sm" />
          </span>
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">
              Curriculum Update Available (v{upgrade.currentVersionNumber} → v{upgrade.latestVersionNumber})
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {upgrade.changeSummary ||
                "A newer curated revision of this template has been published with refined track priorities and milestones."}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-[#A15F4B]/40 hover:bg-[#A15F4B]/10 text-foreground shrink-0 text-xs h-8 px-3"
        >
          Review Update
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Review Curriculum Upgrade
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Evaluate additions and adjustments before updating your workspace&apos;s pinned curriculum version.
            </DialogDescription>
          </DialogHeader>

          {diff ? (
            <TemplateDiff diff={diff} templateName={templateName} />
          ) : (
            <p className="text-xs text-muted-foreground italic py-4">
              Loading version differences...
            </p>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 flex items-center gap-2">
              <AppIcon icon="check" size="xs" />
              <span>Workspace successfully upgraded to version v{upgrade.latestVersionNumber}!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || success}
              onClick={handleUpgrade}
              className="bg-[#A15F4B] text-white hover:bg-[#8A503E]"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <AppIcon icon="spinner" size="xs" className="animate-spin" />
                  Upgrading...
                </span>
              ) : (
                `Accept Upgrade to v${upgrade.latestVersionNumber}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

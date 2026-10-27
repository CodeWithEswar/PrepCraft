"use client"

import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { TemplateTypeBadge, VersionBadge } from "./template-badge"
import { TemplateFit } from "./template-fit"
import { CurriculumLens } from "./template-lens"
import { ApplyTemplateDialog } from "./apply-template-dialog"
import type { ActionResult } from "../server/mutations"
import type { ApplyTemplateInput } from "../schemas/template.schema"
import type {
  TemplateDetail as TemplateDetailType,
  TemplateRecommendation,
} from "../types/template.types"

interface TemplateDetailProps {
  detail: TemplateDetailType
  workspaceId: string
  currentTemplateName?: string | null
  recommendation?: TemplateRecommendation | null
  targetContext?: {
    companyName?: string | null
    roleName?: string | null
    interviewLanguage?: string | null
  }
  onApplyAction?: (input: ApplyTemplateInput) => Promise<ActionResult<{ appliedVersionNumber: number }>>
  onClose?: () => void
  onApplied?: () => void
}

export function TemplateDetailView({
  detail,
  workspaceId,
  currentTemplateName,
  recommendation,
  targetContext,
  onApplyAction,
  onClose,
  onApplied,
}: TemplateDetailProps) {
  const [applyDialogOpen, setApplyDialogOpen] = React.useState(false)

  const { template, version, tracks, topics, patterns, stages, readinessRequirements } = detail

  const totalTrackWeight = tracks.reduce((sum, tr) => sum + tr.weight, 0)
  const isCurrentlyApplied = currentTemplateName === template.name

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Detail Header */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {template.name}
              </h2>
              <TemplateTypeBadge type={template.templateType} />
              <VersionBadge versionNumber={version.versionNumber} isPinned={isCurrentlyApplied} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {template.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-9"
              >
                Back to Catalog
              </Button>
            )}
            {!isCurrentlyApplied && (
              <Button
                type="button"
                size="sm"
                onClick={() => setApplyDialogOpen(true)}
                className="bg-[#A15F4B] text-white hover:bg-[#8A503E] text-xs h-9 px-4 font-medium"
              >
                Use This Template
              </Button>
            )}
          </div>
        </div>

        {/* High-level metadata row */}
        <div className="pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground block">Curriculum Depth</span>
            <span className="font-semibold text-foreground">
              {tracks.length} Tracks · {topics.length} Topics
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Version Status</span>
            <span className="font-semibold text-foreground capitalize">
              {version.status} (v{version.versionNumber})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Target Audience</span>
            <span className="font-semibold text-foreground">
              {template.roleFamilyId ? "Software Engineering" : "General Technical"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Last Curated</span>
            <span className="font-semibold text-foreground">
              {version.publishedAt ? new Date(version.publishedAt).toLocaleDateString() : "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Why This Fits Workspace (Contextual Fit) */}
      <TemplateFit
        templateName={template.name}
        reason={
          recommendation?.reason ||
          `Designed to deliver focused, balanced preparation for ${template.name} without redundant topic clutter.`
        }
        isStrongMatch={recommendation?.isStrongMatch ?? false}
        matchFactors={recommendation?.matchFactors}
        targetContext={targetContext}
      />

      {/* Planning Allocation Overview (Monochrome segmented bar) */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground flex items-center gap-1.5">
            <AppIcon icon="calendar" size="xs" />
            Recommended Planning Allocation
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            Total Weight: {totalTrackWeight} pts
          </span>
        </div>

        {/* Allocation Segments Bar */}
        <div className="h-3 w-full rounded-full bg-surface-elevated overflow-hidden flex border border-border/60">
          {tracks.map((tr, idx) => {
            const pct = totalTrackWeight > 0 ? (tr.weight / totalTrackWeight) * 100 : 0
            const isPrimary = tr.priority === "core" || idx === 0
            return (
              <div
                key={tr.trackId}
                style={{ width: `${pct}%` }}
                className={`h-full transition-all border-r border-background/20 last:border-r-0 ${
                  isPrimary
                    ? "bg-[#A15F4B]"
                    : idx % 2 === 0
                    ? "bg-foreground/50"
                    : "bg-foreground/30"
                }`}
                title={`${tr.trackName}: ${Math.round(pct)}%`}
              />
            )
          })}
        </div>

        {/* Allocation Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] pt-1">
          {tracks.map((tr, idx) => {
            const pct = totalTrackWeight > 0 ? Math.round((tr.weight / totalTrackWeight) * 100) : 0
            const isPrimary = tr.priority === "core" || idx === 0
            return (
              <div key={tr.trackId} className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPrimary ? "bg-[#A15F4B]" : "bg-foreground/40"
                  }`}
                />
                <span className="text-muted-foreground">{tr.trackName}:</span>
                <span className="font-mono font-medium text-foreground">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Curriculum Lens Interaction */}
      <CurriculumLens
        tracks={tracks}
        topics={topics}
        patterns={patterns}
        readinessRequirements={readinessRequirements}
        totalWeight={totalTrackWeight}
      />

      {/* Interview Stages (Round Guidance) */}
      {stages.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground flex items-center gap-1.5">
            <AppIcon icon="folder" size="xs" />
            Interview Round Guidance ({stages.length} Expected Stages)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {stages.map((stg) => (
              <div
                key={stg.id}
                className="rounded-xl border border-border/60 bg-surface-elevated/20 p-3 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{stg.name}</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded border border-border/40">
                    {stg.stageType}
                  </span>
                </div>
                {stg.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {stg.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Dialog */}
      <ApplyTemplateDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        workspaceId={workspaceId}
        template={template}
        version={version}
        currentTemplateName={currentTemplateName}
        onApplyAction={onApplyAction}
        onSuccess={onApplied}
      />
    </div>
  )
}

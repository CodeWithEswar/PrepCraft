"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PriorityBadge, VersionBadge } from "./template-badge"
import { TemplateUpdateBanner } from "./template-update-banner"
import type { ActionResult } from "../server/mutations"
import type { UpgradeTemplateInput } from "../schemas/template.schema"
import type {
  EffectiveWorkspaceCurriculum,
  TemplateUpgradeAvailability,
  CurriculumDiff,
} from "../types/template.types"

interface CurrentTemplateCardProps {
  curriculum: EffectiveWorkspaceCurriculum | null
  upgrade: TemplateUpgradeAvailability | null
  upgradeDiff: CurriculumDiff | null
  workspaceSlug: string
  canEdit: boolean
  onUpgradeAction?: (input: UpgradeTemplateInput) => Promise<ActionResult<{ upgradedVersionNumber: number }>>
}

export function CurrentTemplateCard({
  curriculum,
  upgrade,
  upgradeDiff,
  workspaceSlug,
  canEdit,
  onUpgradeAction,
}: CurrentTemplateCardProps) {
  if (!curriculum) {
    return (
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold">Preparation Curriculum</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            No preparation template is currently pinned to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Select a curated company or role template to establish your preparation tracks, planning weights, and readiness criteria.
          </p>
          <Button
            render={
              <Link href={`/w/${workspaceSlug}/templates`}>
                Browse Preparation Templates
              </Link>
            }
            nativeButton={false}
            size="sm"
            className="bg-[#A15F4B] text-white hover:bg-[#8A503E] text-xs h-8 px-4"
          />
        </CardContent>
      </Card>
    )
  }

  const totalAllocationWeight = curriculum.tracks.reduce((sum, tr) => sum + tr.weight, 0)

  return (
    <div className="space-y-4">
      {/* Update Available Banner if applicable */}
      {upgrade && (
        <TemplateUpdateBanner
          workspaceId={curriculum.workspaceId}
          templateId={curriculum.templateId}
          templateName={curriculum.templateName}
          upgrade={upgrade}
          diff={upgradeDiff}
          onUpgradeAction={onUpgradeAction}
        />
      )}

      {/* Main Template Card */}
      <Card className="border-border/70 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  {curriculum.templateName}
                </CardTitle>
                <VersionBadge versionNumber={curriculum.versionNumber} isPinned />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border/50 capitalize">
                  {curriculum.status}
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Authoritative preparation curriculum pinned to this workspace. Updates to canonical templates do not affect this workspace without confirmation.
              </CardDescription>
            </div>

            {canEdit && (
              <Button
                render={
                  <Link href={`/w/${workspaceSlug}/templates`}>
                    Browse Templates
                  </Link>
                }
                nativeButton={false}
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 shrink-0 border-border/70"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono p-3 rounded-xl bg-surface-elevated/30 border border-border/40">
            <div>
              <span className="text-[10px] text-muted-foreground block">Preparation Tracks</span>
              <span className="font-semibold text-foreground">{curriculum.totalTracks} Active</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Curriculum Topics</span>
              <span className="font-semibold text-foreground">{curriculum.totalTopics} Topics</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Interview Stages</span>
              <span className="font-semibold text-foreground">{curriculum.stages.length} Stages</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Readiness Rules</span>
              <span className="font-semibold text-foreground">{curriculum.readinessRequirements.length} Dimensions</span>
            </div>
          </div>

          {/* Planning Weight Segments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Planning Weights
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {totalAllocationWeight} pts total
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-surface-elevated overflow-hidden flex border border-border/60">
              {curriculum.planningAllocation.map((item, idx) => (
                <div
                  key={item.trackId}
                  style={{ width: `${item.percentage}%` }}
                  className={`h-full ${
                    idx === 0
                      ? "bg-[#A15F4B]"
                      : idx % 2 === 0
                      ? "bg-foreground/50"
                      : "bg-foreground/30"
                  }`}
                  title={`${item.name}: ${item.percentage}%`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              {curriculum.planningAllocation.map((item, idx) => (
                <div key={item.trackId} className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      idx === 0 ? "bg-[#A15F4B]" : "bg-foreground/40"
                    }`}
                  />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-mono text-foreground font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tracks List */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
              Configured Preparation Tracks
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {curriculum.tracks.map((tr) => (
                <div
                  key={tr.trackId}
                  className="rounded-lg border border-border/50 bg-surface-elevated/20 p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground block">{tr.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {tr.topics.length} topics · {tr.weight} pts
                    </span>
                  </div>
                  <PriorityBadge priority={tr.priority} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

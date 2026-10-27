import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { PriorityBadge } from "./template-badge"
import type { CurriculumDiff } from "../types/template.types"

interface TemplateDiffProps {
  diff: CurriculumDiff
  templateName: string
}

export function TemplateDiff({ diff, templateName }: TemplateDiffProps) {
  const hasChanges =
    diff.tracksAdded.length > 0 ||
    diff.tracksRemoved.length > 0 ||
    diff.topicsAdded.length > 0 ||
    diff.topicsRemoved.length > 0 ||
    diff.priorityChanged.length > 0 ||
    diff.weightChanged.length > 0

  return (
    <div className="space-y-4">
      {/* Version Header */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/40 border border-border/70 text-xs">
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            {templateName}
          </span>
          <span className="text-[11px] text-muted-foreground block font-mono">
            Migrating from v{diff.currentVersionNumber} → v{diff.candidateVersionNumber}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
            Current: v{diff.currentVersionNumber}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="px-2 py-0.5 rounded bg-[#A15F4B]/15 text-[#A15F4B] dark:text-[#E2A999] font-medium border border-[#A15F4B]/30">
            Target: v{diff.candidateVersionNumber}
          </span>
        </div>
      </div>

      {/* Progress Preservation Guarantee Alert */}
      <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <span className="text-[#A15F4B]">
            <AppIcon icon="check-circle" size="sm" />
          </span>
          <span>Progress Preservation Guarantee</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          {diff.preservedProgressGuarantee}
        </p>
      </div>

      {/* Changes Summary */}
      {!hasChanges ? (
        <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
          No structural curriculum differences between these versions.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Added Tracks & Topics (+) */}
          {(diff.tracksAdded.length > 0 || diff.topicsAdded.length > 0) && (
            <div className="rounded-xl border border-border/60 bg-surface-elevated/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono">
                <span className="text-emerald-500 font-bold text-sm">+</span>
                <span>Added to Curriculum</span>
              </div>
              <div className="space-y-1.5 pl-4 text-xs">
                {diff.tracksAdded.map((tr) => (
                  <div key={tr.trackId} className="flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground">Track: {tr.name}</span>
                    <PriorityBadge priority={tr.priority} />
                  </div>
                ))}
                {diff.topicsAdded.map((top) => (
                  <div key={top.topicId} className="flex items-center justify-between text-muted-foreground">
                    <span>Topic: {top.name}</span>
                    <PriorityBadge priority={top.priority} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Changes (~) */}
          {diff.priorityChanged.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-surface-elevated/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono">
                <span className="text-amber-500 font-bold text-sm">~</span>
                <span>Priority Updated</span>
              </div>
              <div className="space-y-1.5 pl-4 text-xs">
                {diff.priorityChanged.map((pc) => (
                  <div key={pc.topicId} className="flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground">{pc.name}</span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={pc.oldPriority} />
                      <span className="text-[10px] text-muted-foreground font-mono">→</span>
                      <PriorityBadge priority={pc.newPriority} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight Changed */}
          {diff.weightChanged.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-surface-elevated/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono">
                <span className="text-sky-500 font-bold text-sm">~</span>
                <span>Planning Allocation Adjusted</span>
              </div>
              <div className="space-y-1.5 pl-4 text-xs">
                {diff.weightChanged.map((wc) => (
                  <div key={wc.trackId} className="flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground">{wc.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {wc.oldWeight} pts → <strong className="text-foreground">{wc.newWeight} pts</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Topics (-) */}
          {(diff.tracksRemoved.length > 0 || diff.topicsRemoved.length > 0) && (
            <div className="rounded-xl border border-border/60 bg-surface-elevated/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono">
                <span className="text-muted-foreground font-bold text-sm">-</span>
                <span>Removed from Recommended Path</span>
              </div>
              <div className="space-y-1.5 pl-4 text-xs text-muted-foreground">
                {diff.tracksRemoved.map((tr) => (
                  <div key={tr.trackId} className="flex items-center justify-between">
                    <span>Track: {tr.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">Archived in history</span>
                  </div>
                ))}
                {diff.topicsRemoved.map((top) => (
                  <div key={top.topicId} className="flex items-center justify-between">
                    <span>Topic: {top.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">Archived in history</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

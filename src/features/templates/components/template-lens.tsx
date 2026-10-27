"use client"

import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { PriorityBadge } from "./template-badge"
import type {
  TemplateVersionTrack,
  TemplateVersionTopic,
  TemplateVersionPattern,
  TemplateReadinessRequirement,
} from "../types/template.types"

interface CurriculumLensProps {
  tracks: TemplateVersionTrack[]
  topics: TemplateVersionTopic[]
  patterns: TemplateVersionPattern[]
  readinessRequirements: TemplateReadinessRequirement[]
  totalWeight: number
}

export function CurriculumLens({
  tracks,
  topics,
  patterns,
  readinessRequirements,
  totalWeight,
}: CurriculumLensProps) {
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>(
    tracks[0]?.trackId || ""
  )

  const activeTrack = tracks.find((t) => t.trackId === selectedTrackId) || tracks[0]
  if (!activeTrack) return null

  const activeTopics = topics.filter((t) => t.trackId === activeTrack.trackId)
  const activePatterns = patterns.filter((p) => p.trackId === activeTrack.trackId)

  const allocationPercent =
    totalWeight > 0 ? Math.round((activeTrack.weight / totalWeight) * 100) : 0

  // Related readiness dimension mapping
  const relevantReadiness = readinessRequirements.filter((r) => {
    if (activeTrack.trackId === "track-dsa" && r.dimension === "dsa") return true
    if (activeTrack.trackId === "track-lang" && r.dimension === "programming_language") return true
    if (activeTrack.trackId === "track-cs-core" && r.dimension === "cs_fundamentals") return true
    if (activeTrack.trackId === "track-projects" && r.dimension === "projects") return true
    if (activeTrack.trackId === "track-behavioral" && r.dimension === "behavioral") return true
    return false
  })

  return (
    <div className="space-y-4">
      {/* Track Selection Tabs / Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono text-[11px] uppercase tracking-wider">
            Curriculum Lens · Select Track Focus
          </span>
          <span className="text-[11px] font-mono">
            {tracks.length} Tracks Configured
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-surface-elevated/40 border border-border/60">
          {tracks.map((track) => {
            const isSelected = track.trackId === selectedTrackId
            return (
              <button
                key={track.trackId}
                type="button"
                onClick={() => setSelectedTrackId(track.trackId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/60"
                }`}
              >
                <span>{track.trackName}</span>
                {track.priority === "core" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A15F4B]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lens Inspection Panel */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-5 space-y-5 transition-all">
        {/* Track Title & Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                {activeTrack.trackName}
              </h3>
              <PriorityBadge priority={activeTrack.priority} />
            </div>
            {activeTrack.notes && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeTrack.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs">
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-muted-foreground font-mono block">Planning Weight</span>
              <span className="font-semibold text-foreground font-mono">
                {activeTrack.weight} pts · ~{allocationPercent}%
              </span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-muted-foreground font-mono block">Topic Count</span>
              <span className="font-semibold text-foreground font-mono">
                {activeTopics.length} Topics
              </span>
            </div>
          </div>
        </div>

        {/* Topics Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
            <AppIcon icon="book" size="xs" />
            Curriculum Topics ({activeTopics.length})
          </h4>

          {activeTopics.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No specific sub-topics defined for this track. General track milestones apply.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeTopics.map((topic) => (
                <div
                  key={topic.topicId}
                  className="rounded-lg border border-border/50 bg-surface-elevated/20 p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground block">
                      {topic.topicName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ~{topic.recommendedQuestionCount} solves · depth lvl {topic.recommendedRevisionDepth}
                    </span>
                  </div>
                  <PriorityBadge priority={topic.priority} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pattern Recognition (e.g. For DSA Track) */}
        {activePatterns.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AppIcon icon="code" size="xs" />
              Pattern Recognition Targets ({activePatterns.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {activePatterns.map((pat) => (
                <span
                  key={pat.patternId}
                  className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 bg-surface-elevated/40 px-2.5 py-1 text-foreground"
                >
                  <span className="font-medium">{pat.patternName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({pat.recommendedAttempts} attempts)
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Readiness Expectation */}
        {relevantReadiness.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AppIcon icon="check" size="xs" />
              Readiness Requirement
            </h4>
            {relevantReadiness.map((req) => (
              <div
                key={req.id}
                className="text-xs text-muted-foreground bg-surface-elevated/30 border border-border/40 p-2.5 rounded-lg flex items-center justify-between"
              >
                <span>{req.minimumEvidence}</span>
                <span className="text-[10px] font-mono text-foreground font-medium shrink-0 ml-2">
                  Weight: {req.weight}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

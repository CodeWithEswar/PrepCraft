"use client"

import { Button } from "@/components/ui/button"
import type { PerformanceDimension } from "../../types/mock.types"

interface EvidenceGapsProps {
  gaps: {
    dimension: PerformanceDimension
    label: string
    reason: string
    ctaText?: string
  }[]
  onAddSelfReview?: () => void
}

export function EvidenceGaps({ gaps, onAddSelfReview }: EvidenceGapsProps) {
  if (gaps.length === 0) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="evidence-gaps-heading">
      <div className="pc-section-header-row">
        <h3 id="evidence-gaps-heading">Evidence Gaps</h3>
        <span className="text-xs text-muted-foreground">
          Explicitly unevaluated areas
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {gaps.map((gap) => (
          <div
            key={gap.dimension}
            className="p-3.5 rounded-lg border border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-col gap-1">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                {gap.label} · Not Evaluated
              </span>
              <p className="text-muted-foreground leading-relaxed">{gap.reason}</p>
            </div>

            {gap.ctaText && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs self-start sm:self-auto shrink-0"
                onClick={onAddSelfReview}
              >
                {gap.ctaText}
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

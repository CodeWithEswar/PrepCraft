"use client"

import { AppIcon } from "@/components/app-icon"
import type { EvidenceProvenance } from "../../types/mock.types"

interface DecisionFrictionProps {
  frictions: {
    questionTitle: string
    metric: string
    issue: string
    provenance: EvidenceProvenance
  }[]
}

export function DecisionFriction({ frictions }: DecisionFrictionProps) {
  if (frictions.length === 0) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="decision-friction-heading">
      <div className="pc-section-header-row">
        <h3 id="decision-friction-heading">Decision Friction</h3>
        <span className="text-xs text-muted-foreground">Observed friction under time pressure</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {frictions.map((f, i) => (
          <div
            key={i}
            className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground truncate">
                {f.questionTitle}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 font-semibold shrink-0">
                {f.metric}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.issue}</p>
            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
              Source: Observed session evidence
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { FacetFinding, PerformanceDimension } from "../../types/mock.types"

interface PerformanceFacetsProps {
  facets: Record<PerformanceDimension, FacetFinding>
}

export function PerformanceFacets({ facets }: PerformanceFacetsProps) {
  const [expandedDim, setExpandedDim] = useState<PerformanceDimension | null>(null)

  const facetList = Object.values(facets)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="performance-facets-heading">
      <div className="pc-section-header-row">
        <h3 id="performance-facets-heading">Performance Facets</h3>
        <span className="text-xs text-muted-foreground">
          Evidence-backed dimensions (no arbitrary scores)
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {facetList.map((facet) => {
          const isExpanded = expandedDim === facet.dimension
          return (
            <div
              key={facet.dimension}
              className="p-3.5 rounded-lg border border-border bg-card flex flex-col gap-2 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-36">
                    {facet.title}
                  </span>
                  <span className={`pc-status-tag ${facet.status}`}>
                    {facet.statusText}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Provenance:{" "}
                    <strong className="text-zinc-200 capitalize">
                      {facet.provenance.replace("_", " ")}
                    </strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setExpandedDim((prev) =>
                        prev === facet.dimension ? null : facet.dimension
                      )
                    }
                  >
                    <span>{isExpanded ? "Hide Evidence" : "View Evidence"}</span>
                    <AppIcon
                      icon={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                    />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {facet.summary}
              </p>

              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-border flex flex-col gap-1.5 text-xs text-zinc-300">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Evidence Ledger:
                  </span>
                  <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px] text-muted-foreground">
                    {facet.evidencePoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                  {facet.notEvaluatedReason && (
                    <p className="text-[11px] text-amber-400/90 italic mt-1">
                      Note: {facet.notEvaluatedReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

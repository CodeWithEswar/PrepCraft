"use client"

interface SessionDeltaProps {
  delta?: {
    dimension: string
    previousValue: string
    currentValue: string
    deltaText: string
    comparableCount: number
  } | null
}

export function SessionDelta({ delta }: SessionDeltaProps) {
  if (!delta) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="session-delta-heading">
      <div className="pc-section-header-row">
        <h3 id="session-delta-heading">Session Delta</h3>
        <span className="text-xs text-muted-foreground">
          Comparison against previous comparable session
        </span>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {delta.dimension}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Previous: {delta.previousValue}</span>
            <span>→</span>
            <span className="font-semibold text-foreground">Current: {delta.currentValue}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-bold text-sm text-emerald-400 block">
            {delta.deltaText}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {delta.comparableCount} comparable questions
          </span>
        </div>
      </div>
    </section>
  )
}

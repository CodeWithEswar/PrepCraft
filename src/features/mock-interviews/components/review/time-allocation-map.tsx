"use client"

interface TimeAllocationMapProps {
  allocations: {
    name: string
    section: string
    actualMinutes: number
    targetMinutes: number
    percentage: number
  }[]
}

export function TimeAllocationMap({ allocations }: TimeAllocationMapProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="time-allocation-heading">
      <div className="pc-section-header-row">
        <h3 id="time-allocation-heading">Time Allocation Map</h3>
        <span className="text-xs text-muted-foreground">Actual vs planned target allocation</span>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3">
        {allocations.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">{item.name}</span>
              <span className="font-mono text-muted-foreground">
                <strong className="text-foreground">{item.actualMinutes}m</strong> / {item.targetMinutes}m target
              </span>
            </div>

            <div className="h-2 rounded-full bg-surface-subtle overflow-hidden flex">
              <div
                className="h-full bg-[var(--pc-mock-sienna)] rounded-full transition-all"
                style={{ width: `${Math.min(100, item.percentage)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

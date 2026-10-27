"use client"

interface PressureRailProps {
  elapsedSeconds: number
  totalSeconds: number
  sections?: { title: string; durationMinutes: number }[]
}

export function PressureRail({
  elapsedSeconds,
  totalSeconds,
  sections,
}: PressureRailProps) {
  const safeTotal = Math.max(1, totalSeconds)
  const percentage = Math.min(100, Math.max(0, (elapsedSeconds / safeTotal) * 100))

  return (
    <div
      className="pc-pressure-rail"
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Session timeline progress"
    >
      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground shrink-0">
        Start
      </span>

      <div className="pc-pressure-track">
        <div
          className="pc-pressure-dot"
          style={{ left: `${percentage}%` }}
        />
      </div>

      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground shrink-0">
        Finish
      </span>
    </div>
  )
}

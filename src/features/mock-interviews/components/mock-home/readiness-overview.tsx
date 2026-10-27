"use client"

import { Button } from "@/components/ui/button"

interface ReadinessOverviewProps {
  overallPercentage: number
  dimensions: { name: string; percentage: number }[]
}

export function ReadinessOverview({
  overallPercentage,
  dimensions,
}: ReadinessOverviewProps) {
  // SVG circular gauge math
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (overallPercentage / 100) * circumference

  return (
    <div className="pc-side-card" aria-labelledby="readiness-heading">
      <div className="pc-side-card-header">
        <span className="pc-side-card-title" id="readiness-heading">
          Your Readiness Overview
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
          View Details →
        </Button>
      </div>

      <div className="pc-readiness-body">
        <div className="pc-readiness-circle">
          <svg width="84" height="84" className="-rotate-90">
            <circle
              cx="42"
              cy="42"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="42"
              cy="42"
              r={radius}
              stroke="var(--pc-sienna)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="pc-readiness-val">{overallPercentage}%</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Readiness
            </span>
          </div>
        </div>

        <div className="pc-readiness-bars">
          {dimensions.map((dim) => (
            <div key={dim.name} className="pc-readiness-bar-row">
              <span className="text-muted-foreground w-28 truncate">{dim.name}</span>
              <div className="pc-bar-track">
                <div
                  className="pc-bar-fill"
                  style={{ width: `${dim.percentage}%` }}
                />
              </div>
              <span className="font-semibold text-foreground w-7 text-right">
                {dim.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

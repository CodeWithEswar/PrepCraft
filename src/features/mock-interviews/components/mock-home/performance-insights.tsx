"use client"

import { AppIcon,type AppIconName } from "@/components/app-icon"
import type { DimensionStatus } from "../../types/mock.types"

interface PerformanceInsightsProps {
  insights: {
    id: string
    title: string
    status: DimensionStatus
    statusText: string
    description: string
  }[]
}

export function PerformanceInsights({ insights }: PerformanceInsightsProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="performance-insights-heading">
      <div className="pc-section-header-row">
        <h3 id="performance-insights-heading">Performance Insights</h3>
        <span className="text-xs text-muted-foreground">Based on your recent mock sessions.</span>
      </div>

      <div className="pc-insights-grid">
        {insights.map((item) => {
          let icon:AppIconName = "target"
          if (item.title.toLowerCase().includes("time")) icon = "clock"
          else if (item.title.toLowerCase().includes("testing")) icon = "code"
          else if (item.title.toLowerCase().includes("system")) icon = "network"
          else if (item.title.toLowerCase().includes("behavioral")) icon = "flame"

          return (
            <div key={item.id} className="pc-insight-card">
              <div className="pc-insight-header">
                <span className="pc-insight-title flex items-center gap-1.5">
                  <AppIcon icon={icon} size={15} className="text-muted-foreground" />
                  {item.title}
                </span>
                <span className={`pc-status-tag ${item.status}`}>
                  {item.statusText}
                </span>
              </div>
              <p className="pc-insight-desc">{item.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { MockSectionConfig } from "../../types/mock.types"

interface SessionPreviewCardProps {
  totalDurationMinutes: number
  sections: MockSectionConfig[]
  onStart: () => void
}

export function SessionPreviewCard({
  totalDurationMinutes,
  sections,
  onStart,
}: SessionPreviewCardProps) {
  return (
    <div className="pc-preview-card" aria-labelledby="session-preview-heading">
      <div className="pc-preview-card-header">
        <span className="font-semibold text-sm" id="session-preview-heading">
          Session Preview
        </span>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total Time
          </div>
          <div className="font-bold text-sm text-[#A15F4B]">
            {totalDurationMinutes} minutes
          </div>
        </div>
      </div>

      <div className="pc-preview-timeline">
        {sections.map((sec, idx) => (
          <div key={idx} className="pc-preview-timeline-item">
            <span className="pc-timeline-num">{idx + 1}</span>
            <div className="pc-timeline-details">
              <span className="pc-timeline-title">{sec.title}</span>
              <span className="pc-timeline-sub">
                {sec.count} question{sec.count > 1 ? "s" : ""} ·{" "}
                {sec.type === "coding"
                  ? "Medium/Hard"
                  : sec.type === "project_deep_dive"
                  ? "Behavioral/Technical"
                  : "Mixed"}
              </span>
            </div>
            <span className="pc-timeline-duration">{sec.durationMinutes}m</span>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="pc-btn-sienna w-full mt-2"
        onClick={onStart}
      >
        <span>Start This Mock</span>
        <AppIcon icon="arrow-right" size={16} />
      </Button>
    </div>
  )
}

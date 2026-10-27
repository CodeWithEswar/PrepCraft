"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"

interface UpcomingInterviewCardProps {
  interview?: {
    company: string
    role: string
    type: string
    dateFormatted: string
    daysRemaining: number
  } | null
}

export function UpcomingInterviewCard({ interview }: UpcomingInterviewCardProps) {
  if (!interview) return null

  return (
    <div className="pc-side-card" aria-labelledby="upcoming-interview-heading">
      <div className="pc-side-card-header">
        <span className="pc-side-card-title flex items-center gap-1.5" id="upcoming-interview-heading">
          <AppIcon icon="calendar" size={15} className="text-muted-foreground" />
          Upcoming Interview
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
          Edit
        </Button>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center font-bold text-xs text-foreground">
            {interview.company.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              {interview.company} — {interview.role}
            </div>
            <div className="text-[11px] text-muted-foreground">{interview.type}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-foreground">{interview.dateFormatted}</div>
          <div className="text-[11px] text-[#A15F4B]">in {interview.daysRemaining} days</div>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full text-xs">
        <AppIcon icon="sparkles" size={14} />
        <span>Generate Practice Plan</span>
      </Button>
    </div>
  )
}

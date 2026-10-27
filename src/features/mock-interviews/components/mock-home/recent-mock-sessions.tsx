"use client"

import Link from "next/link"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { MockMode } from "../../types/mock.types"

interface RecentMockSessionsProps {
  workspaceSlug: string
  sessions: {
    id: string
    mode: MockMode
    title: string
    dateFormatted: string
    durationMinutes: number
    solvedRatioText: string
    primaryFindingText: string
    hasReview: boolean
  }[]
  onOpenReview?: (sessionId: string) => void
}

export function RecentMockSessions({
  workspaceSlug,
  sessions,
  onOpenReview,
}: RecentMockSessionsProps) {
  return (
    <div className="pc-side-card" aria-labelledby="recent-sessions-heading">
      <div className="pc-side-card-header">
        <span className="pc-side-card-title flex items-center gap-1.5" id="recent-sessions-heading">
          <AppIcon icon="clock" size={15} className="text-muted-foreground" />
          Recent Mock Sessions
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
          View All →
        </Button>
      </div>

      <div className="pc-recent-list">
        {sessions.map((sess) => {
          const content = (
            <div className="pc-recent-row">
              <div className="pc-recent-info">
                <span className="pc-recent-name">{sess.title}</span>
                <span className="pc-recent-time">
                  {sess.dateFormatted} · {sess.durationMinutes}m
                </span>
              </div>
              <span className="pc-recent-metric">{sess.solvedRatioText}</span>
            </div>
          )

          if (onOpenReview) {
            return (
              <button
                key={sess.id}
                type="button"
                className="w-full text-left"
                onClick={() => onOpenReview(sess.id)}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={sess.id}
              href={`/w/${workspaceSlug}/interview/mocks/${sess.id}/review`}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

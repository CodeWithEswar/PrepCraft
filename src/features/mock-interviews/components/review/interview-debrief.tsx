"use client"

import Link from "next/link"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { PerformanceFacets } from "./performance-facets"
import { SessionReplay } from "./session-replay"
import { TimeAllocationMap } from "./time-allocation-map"
import { DecisionFriction } from "./decision-friction"
import { QuestionReview } from "./question-review"
import { EvidenceGaps } from "./evidence-gaps"
import { SessionDelta } from "./session-delta"
import { NextWeekBridgeWidget } from "../mock-home/next-week-bridge-widget"
import type { MockReview } from "../../types/mock.types"

interface InterviewDebriefProps {
  review: MockReview
  workspaceSlug: string
  onAddToPlan?: (selectedIds: string[]) => void
}

export function InterviewDebrief({
  review,
  workspaceSlug,
  onAddToPlan,
}: InterviewDebriefProps) {
  return (
    <div className="pc-mock-home">
      {/* Review Header */}
      <div className="pc-mock-header">
        <div className="pc-mock-title-group">
          <div className="flex items-center gap-2 text-xs uppercase font-semibold tracking-wider text-[#A15F4B] mb-1">
            <Link
              href={`/w/${workspaceSlug}/interview/mocks`}
              className="hover:underline flex items-center gap-1 text-muted-foreground"
            >
              <AppIcon icon="arrow-left" size={14} />
              Mock Interviews
            </Link>
            <span>/</span>
            <span>Debrief & Findings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {review.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            Completed · {review.durationMinutes} minutes · {review.totalQuestions} questions (
            {review.completedCount} completed, {review.partialCount} partial,{" "}
            {review.unansweredCount} unanswered)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/w/${workspaceSlug}/interview/mocks`}>
            <Button variant="outline" size="sm">
              <AppIcon icon="arrow-left" size={14} />
              <span>Back to Mocks</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Finding Card */}
      <section className="p-5 rounded-xl border border-[var(--pc-mock-sienna)]/30 bg-card text-card-foreground flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase font-bold tracking-wider text-[var(--pc-mock-sienna)]">
              Primary Finding
            </span>
            <span className={`pc-status-tag ${review.primaryFinding.status}`}>
              {review.primaryFinding.title}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Evidence Confidence:{" "}
            <strong className="text-foreground capitalize">
              {review.primaryFinding.confidence}
            </strong>
          </span>
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          {review.primaryFinding.whyItMatters}
        </div>

        <div className="p-3 rounded-lg bg-surface-subtle border border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
            What Happened:
          </span>
          <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px]">
            {review.primaryFinding.whatHappened.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1">
          <span>Source: Observed session evidence</span>
          <span className="text-muted-foreground font-medium">
            Next Action: Focus on pre-submission edge-case testing
          </span>
        </div>
      </section>

      {/* What Held Up (Strengths) */}
      <section className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <AppIcon icon="check" size={15} />
          What Held Up (Strengths)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {review.whatHeldUp.map((item, i) => (
            <div key={i} className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-foreground">{item.title}</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Facets & Evidence Ledger */}
      <PerformanceFacets facets={review.facets} />

      {/* Decision Friction */}
      <DecisionFriction frictions={review.decisionFriction} />

      {/* Question Review Accordion */}
      <QuestionReview questions={review.questionReviews} />

      {/* Time Allocation Map & Session Delta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeAllocationMap allocations={review.timeAllocation} />
        <div className="flex flex-col gap-4">
          <SessionDelta delta={review.sessionDelta} />
          <EvidenceGaps gaps={review.evidenceGaps} />
        </div>
      </div>

      {/* Session Replay */}
      <SessionReplay events={review.sessionReplay} />

      {/* Next Week Bridge Widget */}
      <div className="mt-2">
        <NextWeekBridgeWidget
          proposal={review.nextWeekBridge}
          onAddToPlan={onAddToPlan}
        />
      </div>
    </div>
  )
}

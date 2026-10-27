"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { MockQuestionReviewItem } from "../../types/mock.types"

interface QuestionReviewProps {
  questions: MockQuestionReviewItem[]
}

export function QuestionReview({ questions }: QuestionReviewProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="question-review-heading">
      <div className="pc-section-header-row">
        <h3 id="question-review-heading">Question Review</h3>
        <span className="text-xs text-muted-foreground">Detailed breakdown by problem</span>
      </div>

      <Accordion className="w-full flex flex-col gap-2">
        {questions.map((q, idx) => (
          <AccordionItem
            key={q.itemId}
            value={q.itemId}
            className="border border-border rounded-lg bg-card px-3"
          >
            <AccordionTrigger className="hover:no-underline py-3 text-xs">
              <div className="flex items-center gap-3 text-left flex-1 truncate pr-3">
                <span className="font-mono text-muted-foreground">
                  Q{idx + 1}
                </span>
                <span className="font-semibold text-foreground truncate">
                  {q.title}
                </span>
                <span className="pc-hero-chip text-[10px] py-0 px-2 shrink-0">
                  {q.difficulty}
                </span>
                <span
                  className={`text-[11px] font-semibold shrink-0 ml-auto ${
                    q.passed ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {q.passed ? "Passed" : "Needs Review"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-3 text-xs text-muted-foreground border-t border-border mt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Actual Time</span>
                  <div className="font-semibold text-foreground">
                    {Math.round(q.actualSeconds / 60)} min
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Target Time</span>
                  <div className="font-semibold text-foreground">
                    {q.targetSeconds ? `${Math.round(q.targetSeconds / 60)} min` : "None"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Code Runs</span>
                  <div className="font-semibold text-foreground">{q.runsCount}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Hints Used</span>
                  <div className="font-semibold text-foreground">{q.hintCount}</div>
                </div>
              </div>

              <p className="leading-relaxed text-muted-foreground">{q.summary}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

"use client"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { RevisionEcho } from "../motion/signature-visuals"

export function PracticeDemo() {
  const [reviewed, setReviewed] = useState(false)
  return (
    <div className="mk-practice-demo">
      <div className="mk-demo-label">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brand shrink-0" />
          <span className="font-medium text-foreground">Practice reflection</span>
        </span>
        <Badge variant="outline" className="text-[0.625rem] font-normal tracking-wide shrink-0">
          Interactive sample
        </Badge>
      </div>
      <Tabs defaultValue="attempt">
        <TabsList aria-label="Practice reflection" className="w-full grid grid-cols-3">
          <TabsTrigger value="attempt">Attempt</TabsTrigger>
          <TabsTrigger value="reflection">Reflection</TabsTrigger>
          <TabsTrigger value="revision">Revision</TabsTrigger>
        </TabsList>
        <TabsContent value="attempt" className="mk-practice-tab-content">
          <div className="mk-attempt-title">
            <div className="min-w-0">
              <p className="mk-kicker truncate">Arrays / two pointers</p>
              <h3 className="truncate">Two Sum II</h3>
            </div>
            <Badge variant="secondary" className="shrink-0">Medium</Badge>
          </div>
          <div className="mk-attempt-meta">
            <span><AppIcon icon="clock" size={14} />24 min</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success shrink-0" />
              Pattern recognized
            </span>
          </div>
          <div className="mk-code-wrapper">
            <pre className="mk-code" tabIndex={0} role="region" aria-label="Illustrative Two Sum code sample">
              <code>{`while (left < right) {\n  const sum = numbers[left] + numbers[right];\n  if (sum === target) {\n    return [left + 1, right + 1];\n  }\n  sum < target ? left++ : right--;\n}`}</code>
            </pre>
          </div>
          <p className="mk-demo-disclaimer">Illustrative snippet · code execution is not available in this preview.</p>
        </TabsContent>
        <TabsContent value="reflection" className="mk-practice-tab-content">
          <div className="mk-attempt-title">
            <div className="min-w-0">
              <p className="mk-kicker">Reflection log</p>
              <h3>The pattern was right.<br className="mk-desktop-break" /> The boundary wasn’t.</h3>
            </div>
            <Badge variant="outline" className="shrink-0">Edge cases</Badge>
          </div>
          <p className="mk-reflection-copy">
            I returned zero-based indices. The problem asks for one-based positions. Next time: read the output contract before coding.
          </p>
          <div className="pt-1">
            <Button variant={reviewed ? "secondary" : "glass"} size="sm" onClick={() => setReviewed(!reviewed)}>
              <AppIcon icon="check" size={16} />
              {reviewed ? "Lesson reviewed" : "Mark lesson reviewed"}
            </Button>
          </div>
          <p className="mk-demo-disclaimer" aria-live="polite">
            {reviewed ? "Sample lesson marked as reviewed for this visit." : "Sample reflection · no account or saved record."}</p>
        </TabsContent>
        <TabsContent value="revision" className="mk-practice-tab-content">
          <div className="mk-attempt-title">
            <div className="min-w-0">
              <p className="mk-kicker">Spaced repetition</p>
              <h3>Solved once ≠ remembered.</h3>
            </div>
            <Badge variant="outline" className="shrink-0">Cadence</Badge>
          </div>
          <div className="py-2 overflow-hidden flex items-center justify-center">
            <RevisionEcho />
          </div>
          <ol className="mk-revision-schedule">
            <li>
              <strong>Today</strong>
              <span>Recheck the output contract</span>
            </li>
            <li>
              <strong>In 3 days</strong>
              <span>Solve without the earlier approach</span>
            </li>
            <li>
              <strong>In 7 days</strong>
              <span>Try a timed variation</span>
            </li>
          </ol>
          <p className="mk-demo-disclaimer">Example intervals, not an automatically assigned schedule.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}

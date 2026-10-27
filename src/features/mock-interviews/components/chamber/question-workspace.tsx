"use client"

import { useState } from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { MockSessionItem, SimulationPolicy } from "../../types/mock.types"

interface QuestionWorkspaceProps {
  item: MockSessionItem
  policy: SimulationPolicy
  onCodeChange: (code: string) => void
  onAnswerChange: (answer: string) => void
  onScratchpadChange: (scratchpad: string) => void
  onFlag: (flagged: boolean) => void
  onRunCode: () => void
  isFlagged: boolean
  isRunningCode?: boolean
  codeRunOutput?: string | null
  onNextQuestion: () => void
  onPrevQuestion: () => void
  hasNext: boolean
  hasPrev: boolean
}

export function QuestionWorkspace({
  item,
  policy,
  onCodeChange,
  onAnswerChange,
  onScratchpadChange,
  onFlag,
  onRunCode,
  isFlagged,
  isRunningCode,
  codeRunOutput,
  onNextQuestion,
  onPrevQuestion,
  hasNext,
  hasPrev,
}: QuestionWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>("editor")
  const [revealedHintIndex, setRevealedHintIndex] = useState<number | null>(null)

  const isCoding = item.sourceType === "question" || item.code !== undefined

  return (
    <div className="pc-chamber-split">
      {/* Left Pane: Question Details */}
      <section className="pc-chamber-left-pane" aria-labelledby="question-detail-title">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              Q{item.sortOrder + 1}
            </span>
            <span className="text-xs uppercase font-semibold tracking-wider text-[#A15F4B]">
              {item.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="pc-hero-chip text-[11px] py-0.5">
              {item.difficultySnapshot}
            </span>
            {item.targetDurationSeconds && (
              <span className="pc-hero-chip text-[11px] py-0.5">
                <AppIcon icon="clock" size={12} />
                Target: {Math.round(item.targetDurationSeconds / 60)}m
              </span>
            )}
          </div>
        </div>

        <h2 id="question-detail-title" className="text-base sm:text-lg font-bold text-foreground mb-3">
          {item.title}
        </h2>

        <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap mb-5">
          {item.body}
        </div>

        {item.examples && item.examples.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Examples
            </h4>
            {item.examples.map((ex, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border bg-surface-subtle text-xs font-mono flex flex-col gap-1.5"
              >
                <div>
                  <span className="text-muted-foreground">Input: </span>
                  <span className="text-foreground">{ex.input}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Output: </span>
                  <span className="text-[#A15F4B] font-semibold">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <div className="text-muted-foreground text-[11px] font-sans mt-0.5">
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {item.constraints && (
          <div className="flex flex-col gap-1.5 mb-5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Constraints
            </h4>
            <pre className="p-3 rounded-lg border border-border bg-surface-subtle text-xs text-muted-foreground whitespace-pre-wrap font-mono">
              {item.constraints}
            </pre>
          </div>
        )}

        {/* Hints Section (If policy allows) */}
        {policy.hintPolicy !== "forbidden" && item.hints && item.hints.length > 0 && (
          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <AppIcon icon="hint" size={14} className="text-amber-500" />
                Available Hints ({item.hints.length})
              </span>
            </div>

            {item.hints.map((hint, idx) => {
              const isRevealed = revealedHintIndex !== null && revealedHintIndex >= idx
              return (
                <div
                  key={hint.level}
                  className="p-2.5 rounded-lg border border-border bg-surface-subtle text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Hint {hint.level}: {hint.title}
                    </span>
                    {!isRevealed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-[#A15F4B]"
                        onClick={() => setRevealedHintIndex(idx)}
                      >
                        Reveal Hint
                      </Button>
                    )}
                  </div>
                  {isRevealed && (
                    <p className="mt-2 text-muted-foreground text-[11px] leading-relaxed">
                      {hint.body}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Right Pane: Workspace / Code Editor / Scratchpad */}
      <section className="pc-chamber-workspace-pane" aria-label="Response Workspace">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 bg-surface-elevated">
            <TabsList className="bg-transparent h-7 p-0 gap-1">
              <TabsTrigger
                value="editor"
                className="text-xs h-7 px-3 data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
              >
                {isCoding ? "Code Implementation" : "Response"}
              </TabsTrigger>
              {policy.allowScratchpad && (
                <TabsTrigger
                  value="scratchpad"
                  className="text-xs h-7 px-3 data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
                >
                  Personal Scratchpad
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs gap-1.5 ${
                  isFlagged ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground"
                }`}
                onClick={() => onFlag(!isFlagged)}
              >
                <AppIcon icon="flag" size={13} />
                <span>{isFlagged ? "Flagged" : "Flag"}</span>
              </Button>
            </div>
          </div>

          <TabsContent value="editor" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
            {isCoding ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <Textarea
                  value={item.code || ""}
                  onChange={(e) => onCodeChange(e.target.value)}
                  placeholder="// Implement your solution here..."
                  className="flex-1 font-mono text-xs bg-transparent border-none rounded-none focus-visible:ring-0 p-4 resize-none leading-relaxed text-foreground"
                />

                {/* Test Output Panel */}
                {codeRunOutput && (
                  <div className="p-3 border-t border-border bg-surface-subtle font-mono text-xs max-h-36 overflow-y-auto">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Execution Result
                    </div>
                    <pre className="text-emerald-600 dark:text-emerald-400 text-[11px] whitespace-pre-wrap">
                      {codeRunOutput}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={item.answer || ""}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Structure your answer clearly (Situation, Task, Action, Result / Conceptual Explanation)..."
                className="flex-1 text-xs bg-transparent border-none rounded-none focus-visible:ring-0 p-4 resize-none leading-relaxed text-foreground"
              />
            )}
          </TabsContent>

          {policy.allowScratchpad && (
            <TabsContent value="scratchpad" className="flex-1 p-0 m-0 flex flex-col">
              <Textarea
                value={item.scratchpad || ""}
                onChange={(e) => onScratchpadChange(e.target.value)}
                placeholder="Scratchpad for Big-O complexity notes, edge case checklists, or outline..."
                className="flex-1 font-mono text-xs bg-transparent border-none rounded-none focus-visible:ring-0 p-4 resize-none leading-relaxed text-foreground"
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Footer Navigation Bar */}
        <div className="pc-chamber-footer">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={!hasPrev}
              onClick={onPrevQuestion}
            >
              <AppIcon icon="arrow-left" size={14} />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={!hasNext}
              onClick={onNextQuestion}
            >
              <span>Next</span>
              <AppIcon icon="arrow-right" size={14} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isCoding && policy.allowCodeExecution && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={isRunningCode}
                onClick={onRunCode}
              >
                {isRunningCode ? (
                  <>
                    <AppIcon icon="spinner" size={14} className="animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <AppIcon icon="play" size={14} />
                    <span>Run Code</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

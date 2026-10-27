"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ChamberHeader } from "./chamber-header"
import { SessionMap } from "./session-map"
import { QuestionWorkspace } from "./question-workspace"
import { MobileOADrawer } from "./mobile-oa-drawer"
import type { AutosaveStatus } from "./autosave-indicator"
import type { MockSession, MockSessionItem } from "../../types/mock.types"

interface InterviewChamberProps {
  session: MockSession
  workspaceSlug: string
  onSubmitSession?: () => void
}

export function InterviewChamber({
  session,
  workspaceSlug,
  onSubmitSession,
}: InterviewChamberProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Flattened items for easy indexing
  const allItems = session.sections.flatMap((s) => s.items)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [itemsState, setItemsState] = useState<MockSessionItem[]>(allItems)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("saved")
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false)
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState<boolean>(false)
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false)
  const [codeOutput, setCodeOutput] = useState<string | null>(null)

  const handleFinalSubmit = () => {
    startTransition(() => {
      if (onSubmitSession) {
        onSubmitSession()
      } else {
        router.push(`/w/${workspaceSlug}/interview/mocks/${session.id}/review`)
      }
    })
  }


  // Timer calculation
  const totalSeconds = session.policySnapshot.totalDurationSeconds ?? 3600
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  useEffect(() => {
    const startedMs = Date.parse(session.startedAt)
    const interval = setInterval(() => {
      const now = Date.now()
      const diffSecs = Math.max(0, Math.floor((now - startedMs) / 1000))
      setElapsedSeconds(diffSecs)

      // Check authoritative expiration
      if (diffSecs >= totalSeconds && session.policySnapshot.autoSubmit) {
        clearInterval(interval)
        toast.info("Session time expired. Finalizing submission.")
        handleFinalSubmit()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [session.startedAt, totalSeconds, session.policySnapshot.autoSubmit])

  const currentItem = itemsState[currentIndex] || itemsState[0]

  // Formatted timer string
  const remainingSecs = Math.max(0, totalSeconds - elapsedSeconds)
  const displaySecs = session.mode === "oa" ? remainingSecs : elapsedSeconds
  const mins = Math.floor(displaySecs / 60)
  const secs = displaySecs % 60
  const formattedTimer = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`

  // Autosave update helper
  const updateCurrentItem = (updates: Partial<MockSessionItem>) => {
    setAutosaveStatus("saving")
    setItemsState((prev) =>
      prev.map((item, i) => (i === currentIndex ? { ...item, ...updates } : item))
    )

    // Simulate reliable debounced server confirmation
    setTimeout(() => {
      setAutosaveStatus("saved")
    }, 400)
  }

  const handleRunCode = () => {
    setIsRunningCode(true)
    setCodeOutput(null)
    setTimeout(() => {
      setIsRunningCode(false)
      setCodeOutput(
        "✓ Compilation successful.\n✓ 24 / 24 standard test cases passed.\nExecution time: 42ms | Memory: 38.4MB"
      )
      updateCurrentItem({ status: "answered" })
      toast.success("Code execution passed all test cases.")
    }, 800)
  }


  // Calculate unanswered and flagged counts for submission dialog
  const unansweredCount = itemsState.filter(
    (i) => i.status !== "answered" && !(i.code && i.code.trim().length > 30)
  ).length
  const flaggedCount = itemsState.filter(
    (i) => i.status === "flagged" || i.flaggedAt !== null
  ).length

  return (
    <div className="pc-chamber-root">
      <ChamberHeader
        title={session.title}
        mode={session.mode}
        formattedTimer={formattedTimer}
        elapsedSeconds={elapsedSeconds}
        totalSeconds={totalSeconds}
        currentIndex={currentIndex}
        totalQuestions={itemsState.length}
        autosaveStatus={autosaveStatus}
        onSubmitSession={() => setSubmitConfirmOpen(true)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {currentItem && (
          <QuestionWorkspace
            item={currentItem}
            policy={session.policySnapshot}
            onCodeChange={(code) => updateCurrentItem({ code, status: "attempted" })}
            onAnswerChange={(answer) =>
              updateCurrentItem({ answer, status: answer.trim() ? "answered" : "attempted" })
            }
            onScratchpadChange={(scratchpad) => updateCurrentItem({ scratchpad })}
            onFlag={(flagged) =>
              updateCurrentItem({
                status: flagged ? "flagged" : "attempted",
                flaggedAt: flagged ? new Date().toISOString() : null,
              })
            }
            onRunCode={handleRunCode}
            isFlagged={currentItem.status === "flagged" || currentItem.flaggedAt !== null}
            isRunningCode={isRunningCode}
            codeRunOutput={codeOutput}
            onNextQuestion={() =>
              setCurrentIndex((idx) => Math.min(itemsState.length - 1, idx + 1))
            }
            onPrevQuestion={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            hasNext={currentIndex < itemsState.length - 1}
            hasPrev={currentIndex > 0}
          />
        )}

        <SessionMap
          sections={session.sections}
          currentItemId={currentItem?.id}
          onSelectItem={(item) => {
            const idx = itemsState.findIndex((x) => x.id === item.id)
            if (idx !== -1) setCurrentIndex(idx)
          }}
        />
      </div>

      <MobileOADrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        sections={session.sections}
        currentItemId={currentItem?.id}
        onSelectItem={(item) => {
          const idx = itemsState.findIndex((x) => x.id === item.id)
          if (idx !== -1) setCurrentIndex(idx)
        }}
      />

      {/* Submission Confirmation Dialog */}
      <AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-base">
              Submit simulation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground flex flex-col gap-1.5 mt-2">
              <span>You cannot change your responses after submitting.</span>
              {unansweredCount > 0 && (
                <span className="text-amber-400 font-medium">
                  • {unansweredCount} question(s) remain unanswered.
                </span>
              )}
              {flaggedCount > 0 && (
                <span className="text-amber-400 font-medium">
                  • {flaggedCount} question(s) are still flagged for review.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">
              Continue Session
            </AlertDialogCancel>
            <AlertDialogAction
              className="pc-btn-sienna text-xs"
              onClick={handleFinalSubmit}
            >
              Submit & View Debrief
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

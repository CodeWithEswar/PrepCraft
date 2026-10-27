"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SessionBlueprint, SimulationPolicy } from "../../types/mock.types"

interface PreFlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blueprint?: SessionBlueprint | null
  policy?: SimulationPolicy | null
  totalQuestions: number
  durationMinutes: number
  onConfirmStart: () => void
  isStarting?: boolean
}

export function PreFlightDialog({
  open,
  onOpenChange,
  blueprint,
  policy,
  totalQuestions,
  durationMinutes,
  onConfirmStart,
  isStarting,
}: PreFlightDialogProps) {
  const title = blueprint?.name ?? "Simulated Interview Session"
  const pauseText =
    policy?.pausePolicy === "forbidden"
      ? "Not available (OA rules)"
      : policy?.pausePolicy === "restricted"
      ? "Restricted"
      : "Allowed"
  const hintsText =
    policy?.hintPolicy === "forbidden"
      ? "Disabled"
      : policy?.hintPolicy === "limited"
      ? "Limited"
      : "Allowed"
  const autoSubmitText = policy?.autoSubmit
    ? "Automatic at expiration"
    : "Manual submission required"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border text-card-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A15F4B] mb-1">
            <AppIcon icon="target" size={14} />
            Session Pre-Flight
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Confirm simulation constraints before starting. The session timer starts
            only upon server authorization.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 my-3 py-2 border-y border-border text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-semibold text-foreground">{durationMinutes} minutes</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Questions</span>
            <span className="font-semibold text-foreground">{totalQuestions} questions</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Pause Policy</span>
            <span className="font-semibold text-foreground">{pauseText}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Hints</span>
            <span className="font-semibold text-foreground">{hintsText}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Navigation</span>
            <span className="font-semibold text-foreground">
              {policy?.navigationPolicy === "sequential" ? "Sequential" : "Flexible"}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Code Execution</span>
            <span className="font-semibold text-foreground">
              {policy?.allowCodeExecution ? "Sandboxed Runner Active" : "Not applicable"}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Submission</span>
            <span className="font-semibold text-[#A15F4B]">{autoSubmitText}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="pc-btn-sienna"
            onClick={onConfirmStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <AppIcon icon="spinner" size={14} className="animate-spin" />
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <span>Start Session</span>
                <AppIcon icon="arrow-right" size={14} />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

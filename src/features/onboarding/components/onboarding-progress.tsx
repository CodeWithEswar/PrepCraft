"use client"
import * as React from "react"
import type { OnboardingStage } from "../types/onboarding.types"
import { calculateProgress } from "../services/onboarding-transition"
import { cn } from "cn"

interface OnboardingProgressProps {
  currentStage: OnboardingStage
  className?: string
}

const STEP_DEFINITIONS: Array<{ stage: OnboardingStage; label: string }> = [
  { stage: "profile", label: "Profile" },
  { stage: "target", label: "Target" },
  { stage: "language", label: "Language" },
  { stage: "commitment", label: "Commitment" },
  { stage: "target-date", label: "Target Date" },
  { stage: "workspace", label: "Workspace" },
]

export function OnboardingProgress({ currentStage, className }: OnboardingProgressProps) {
  // Hide numbered progress on welcome and ready steps
  if (currentStage === "welcome" || currentStage === "ready") {
    return null
  }

  const { currentStep, totalSteps, percent, stageName } = calculateProgress(currentStage)

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Onboarding progress: Step ${currentStep} of ${totalSteps}, ${stageName}`}
      className={cn("w-full max-w-xl mx-auto px-4 sm:px-0 py-2 space-y-2", className)}
    >
      {/* Desktop / Tablet: Segmented Step Indicators */}
      <div className="hidden sm:flex items-center justify-between gap-2">
        {STEP_DEFINITIONS.map((def, idx) => {
          const stepIndex = idx + 1
          const isCompleted = stepIndex < currentStep
          const isCurrent = stepIndex === currentStep

          return (
            <div key={def.stage} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div
                className={cn(
                  "w-full h-1.5 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-brand/80"
                    : isCurrent
                      ? "bg-brand shadow-xs"
                      : "bg-muted/60 dark:bg-muted/30"
                )}
              />
              <span
                className={cn(
                  "text-[0.7rem] font-medium tracking-tight transition-colors",
                  isCurrent
                    ? "text-brand font-semibold"
                    : isCompleted
                      ? "text-foreground/80"
                      : "text-muted-foreground/60"
                )}
              >
                {def.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile: Compact step counter + slim progress bar */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-muted-foreground font-mono text-[0.7rem]">
            {stageName} · {percent}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted/60 dark:bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

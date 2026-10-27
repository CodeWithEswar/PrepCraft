"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { PressureRail } from "./pressure-rail"
import { AutosaveIndicator, type AutosaveStatus } from "./autosave-indicator"
import type { MockMode } from "../../types/mock.types"

interface ChamberHeaderProps {
  title: string
  mode: MockMode
  formattedTimer: string
  elapsedSeconds: number
  totalSeconds: number
  currentIndex: number
  totalQuestions: number
  autosaveStatus: AutosaveStatus
  onSubmitSession: () => void
  onOpenMobileNav?: () => void
}

export function ChamberHeader({
  title,
  mode,
  formattedTimer,
  elapsedSeconds,
  totalSeconds,
  currentIndex,
  totalQuestions,
  autosaveStatus,
  onSubmitSession,
  onOpenMobileNav,
}: ChamberHeaderProps) {
  return (
    <header className="pc-chamber-header">
      <div className="pc-chamber-identity">
        <div className="flex flex-col">
          <span className="pc-chamber-session-title truncate max-w-[200px] md:max-w-[320px]">
            {title}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            {mode === "oa" ? "Online Assessment" : "Simulation Chamber"}
          </span>
        </div>
      </div>

      <div className="hidden md:flex flex-1 mx-4">
        <PressureRail
          elapsedSeconds={elapsedSeconds}
          totalSeconds={totalSeconds}
        />
      </div>

      <div className="pc-chamber-actions">
        <AutosaveIndicator status={autosaveStatus} />

        <div className="pc-chamber-timer-badge" aria-label={`Time: ${formattedTimer}`}>
          {formattedTimer}
        </div>

        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
          Q {currentIndex + 1} / {totalQuestions}
        </span>

        {onOpenMobileNav && (
          <Button
            variant="outline"
            size="sm"
            className="md:hidden h-8 px-2 text-xs"
            onClick={onOpenMobileNav}
          >
            <AppIcon icon="menu" size={14} />
            <span className="sr-only">Question Navigator</span>
          </Button>
        )}

        <Button
          size="sm"
          className="pc-btn-sienna h-8 text-xs font-semibold px-3"
          onClick={onSubmitSession}
        >
          <span>Submit</span>
        </Button>
      </div>
    </header>
  )
}

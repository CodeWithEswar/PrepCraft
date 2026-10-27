"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { commitmentStepSchema, type CommitmentStepValues } from "../schemas/commitment.schema"
import type { CommitmentPreset, StudyDay, MutationResult } from "../types/onboarding.types"
import {
  ALL_STUDY_DAYS,
  COMMITMENT_PRESETS,
  calculateWeeklyMinutes,
  formatMinutesToHours,
  getDayDisplayName,
  getDayShortName,
} from "../services/commitment"
import { Label } from "@/components/ui/label"
import { AppIcon } from "@/components/app-icon"
import { OnboardingActions } from "./onboarding-actions"
import { cn } from "cn"

interface CommitmentStepProps {
  initialValues?: {
    weeklyTargetMinutes?: number | null
    studyDays?: StudyDay[] | null
    defaultDailyMinutes?: number | null
  }
  onSaveAction?: (values: CommitmentStepValues) => Promise<MutationResult>
}

const DAILY_MINUTE_OPTIONS = [
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
]

export function CommitmentStep({ initialValues, onSaveAction }: CommitmentStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const defaultDays: StudyDay[] =
    initialValues?.studyDays && initialValues.studyDays.length > 0
      ? initialValues.studyDays
      : ["monday", "tuesday", "wednesday", "thursday", "friday"]

  const defaultDaily = initialValues?.defaultDailyMinutes || 120
  const defaultWeekly = initialValues?.weeklyTargetMinutes || defaultDays.length * defaultDaily

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CommitmentStepValues>({
    resolver: zodResolver(commitmentStepSchema),
    defaultValues: {
      preset: "balanced",
      weeklyTargetMinutes: defaultWeekly,
      studyDays: defaultDays,
      defaultDailyMinutes: defaultDaily,
    },
  })

  const currentPreset = watch("preset")
  const currentStudyDays = watch("studyDays") || []
  const currentDailyMinutes = watch("defaultDailyMinutes") || 120
  const currentWeeklyMinutes = watch("weeklyTargetMinutes") || 600

  // Apply preset
  const handleSelectPreset = (presetKey: CommitmentPreset) => {
    setValue("preset", presetKey)
    if (presetKey !== "custom") {
      const config = COMMITMENT_PRESETS[presetKey]
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as StudyDay[]
      setValue("studyDays", days)
      setValue("defaultDailyMinutes", config.defaultDailyMinutes)
      setValue("weeklyTargetMinutes", config.weeklyMinutes)
    }
  }

  // Toggle study day
  const handleToggleDay = (day: StudyDay) => {
    let nextDays: StudyDay[]
    if (currentStudyDays.includes(day)) {
      if (currentStudyDays.length === 1) return // Keep at least one day
      nextDays = currentStudyDays.filter((d) => d !== day)
    } else {
      nextDays = [...currentStudyDays, day]
    }
    setValue("studyDays", nextDays)
    setValue("preset", "custom")
    const newWeekly = calculateWeeklyMinutes(nextDays.length, currentDailyMinutes)
    setValue("weeklyTargetMinutes", newWeekly)
  }

  // Change daily minutes
  const handleSelectDailyMinutes = (mins: number) => {
    setValue("defaultDailyMinutes", mins)
    setValue("preset", "custom")
    const newWeekly = calculateWeeklyMinutes(currentStudyDays.length, mins)
    setValue("weeklyTargetMinutes", newWeekly)
  }

  const onSubmit = (values: CommitmentStepValues) => {
    setServerError(null)
    startTransition(async () => {
      if (!onSaveAction) {
        setServerError("Submission handler is not available")
        return
      }
      const res = await onSaveAction(values)
      if (!res.success) {
        setServerError(res.error)
      } else if (res.nextUrl) {
        router.push(res.nextUrl)
      }
    })
  }

  const weeklyHours = (currentWeeklyMinutes / 60).toFixed(1).replace(/\.0$/, "")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Build a schedule you can maintain
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Consistency outperforms short bursts. PrepCraft calibrates daily tasks to your real bandwidth.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">Schedule Presets</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["light", "balanced", "focused", "intensive"] as const).map((key) => {
            const preset = COMMITMENT_PRESETS[key]
            const isSelected = currentPreset === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1",
                  isSelected
                    ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50 shadow-xs"
                    : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">{preset.label}</span>
                  {isSelected && (
                    <div className="size-3.5 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                      <AppIcon icon="check" size={8} />
                    </div>
                  )}
                </div>
                <span className="text-[0.68rem] font-medium text-brand">~{preset.hoursPerWeek}h / week</span>
                <span className="text-[0.62rem] text-muted-foreground leading-tight line-clamp-1">
                  {preset.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">Study Days</Label>
          <span className="text-xs text-muted-foreground">
            {currentStudyDays.length} day{currentStudyDays.length === 1 ? "" : "s"} selected
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {ALL_STUDY_DAYS.map((day) => {
            const isSelected = currentStudyDays.includes(day)
            const fullLabel = getDayDisplayName(day)
            const shortLabel = getDayShortName(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleToggleDay(day)}
                aria-label={`${fullLabel} ${isSelected ? "selected" : "unselected"}`}
                aria-pressed={isSelected}
                className={cn(
                  "flex-1 h-11 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 select-none",
                  isSelected
                    ? "border-brand bg-brand text-primary-foreground shadow-xs"
                    : "border-border/70 bg-surface/60 text-muted-foreground hover:bg-surface-elevated/80 hover:text-foreground"
                )}
              >
                <span>{shortLabel}</span>
                <span className="text-[0.6rem] font-normal opacity-80 sm:hidden">
                  {fullLabel.slice(0, 2)}
                </span>
                <span className="text-[0.6rem] font-normal opacity-80 hidden sm:inline">
                  {fullLabel.slice(0, 3)}
                </span>
              </button>
            )
          })}
        </div>
        {errors.studyDays && (
          <p className="text-xs text-destructive">{errors.studyDays.message}</p>
        )}
      </div>

      {/* Daily Time Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">Daily Session Length</Label>
          <span className="text-xs text-brand font-medium">
            {formatMinutesToHours(currentDailyMinutes)} per study day
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DAILY_MINUTE_OPTIONS.map((opt) => {
            const isSelected = currentDailyMinutes === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectDailyMinutes(opt.value)}
                className={cn(
                  "py-2 px-2 rounded-lg border text-xs font-medium transition-all text-center",
                  isSelected
                    ? "border-brand bg-brand/10 text-brand ring-1 ring-brand/50 font-semibold"
                    : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Live Weekly Summary Box */}
      <div className="p-3.5 rounded-xl border border-border/80 bg-surface-elevated/60 flex items-center justify-between gap-3 text-sm">
        <div className="space-y-0.5">
          <p className="text-[0.7rem] uppercase tracking-wider font-semibold text-muted-foreground">
            Weekly Commitment
          </p>
          <p className="text-xs text-muted-foreground">
            {currentStudyDays.length} days × {formatMinutesToHours(currentDailyMinutes)}/day
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-foreground">
            {weeklyHours} <span className="text-xs font-normal text-muted-foreground">hrs/week</span>
          </span>
        </div>
      </div>

      {currentWeeklyMinutes > 1500 && (
        <p className="text-xs text-muted-foreground text-center">
          Note: This creates an intensive preparation schedule. You can adjust your hours anytime in workspace settings.
        </p>
      )}

      {serverError && (
        <p className="text-xs text-destructive text-center font-medium">{serverError}</p>
      )}

      {/* Action Footer */}
      <OnboardingActions
        continueLabel="Continue"
        backHref="/onboarding/language"
        isPending={isPending}
      />
    </form>
  )
}

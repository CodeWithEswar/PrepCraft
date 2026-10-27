"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInDays, differenceInWeeks, format, addMonths } from "date-fns"
import { targetDateStepSchema, type TargetDateStepValues } from "../schemas/target-date.schema"
import type { MutationResult } from "../types/onboarding.types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppIcon } from "@/components/app-icon"
import { OnboardingActions } from "./onboarding-actions"
import { cn } from "cn"

interface TargetDateStepProps {
  initialValues?: {
    hasTargetDate?: boolean
    targetDate?: string | null
  }
  onSaveAction?: (values: TargetDateStepValues) => Promise<MutationResult>
}

export function TargetDateStep({ initialValues, onSaveAction }: TargetDateStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  // Default date suggestion is ~2 months from now if enabling date mode
  const suggestedDate = format(addMonths(new Date(), 2), "yyyy-MM-dd")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<TargetDateStepValues>({
    resolver: zodResolver(targetDateStepSchema),
    defaultValues: {
      hasTargetDate: Boolean(initialValues?.hasTargetDate),
      targetDate: initialValues?.targetDate || suggestedDate,
    },
  })

  const hasTargetDate = watch("hasTargetDate")
  const selectedDateStr = watch("targetDate")

  // Relative calculation
  let dateContext = ""
  if (hasTargetDate && selectedDateStr) {
    const parsed = new Date(selectedDateStr)
    if (!isNaN(parsed.getTime())) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const days = differenceInDays(parsed, today)
      const weeks = differenceInWeeks(parsed, today)
      if (days >= 0) {
        if (days === 0) {
          dateContext = "Target is today"
        } else if (days < 14) {
          dateContext = `${days} day${days === 1 ? "" : "s"} remaining`
        } else {
          dateContext = `${days} days to prepare · About ${weeks} week${weeks === 1 ? "" : "s"}`
        }
      }
    }
  }

  const onSubmit = (values: TargetDateStepValues) => {
    setServerError(null)
    startTransition(async () => {
      if (!onSaveAction) {
        setServerError("Submission handler is not available")
        return
      }
      const res = await onSaveAction(values)
      if (!res.success) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msg]) => {
            setError(field as keyof TargetDateStepValues, { message: String(msg) })
          })
        }
        setServerError(res.error)
      } else if (res.nextUrl) {
        router.push(res.nextUrl)
      }
    })
  }

  const minDateStr = format(new Date(), "yyyy-MM-dd")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Are you preparing for a specific date?
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          A target date helps pace topics before upcoming interviews or campus placements.
        </p>
      </div>

      {/* Choice Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option 1: Yes, target date */}
        <button
          type="button"
          onClick={() => setValue("hasTargetDate", true)}
          className={cn(
            "p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2",
            hasTargetDate
              ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50 shadow-xs"
              : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold">Yes, I have a target date</span>
            {hasTargetDate && (
              <div className="size-4 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                <AppIcon icon="check" size={10} />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground leading-tight">
            I have an upcoming interview, campus drive, or target completion deadline.
          </span>
        </button>

        {/* Option 2: No fixed date */}
        <button
          type="button"
          onClick={() => setValue("hasTargetDate", false)}
          className={cn(
            "p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2",
            !hasTargetDate
              ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50 shadow-xs"
              : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold">No fixed date yet</span>
            {!hasTargetDate && (
              <div className="size-4 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                <AppIcon icon="check" size={10} />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground leading-tight">
            Build sustainable readiness based purely on my weekly study commitment.
          </span>
        </button>
      </div>

      {/* Calendar Date Picker container when enabled */}
      {hasTargetDate && (
        <div className="p-4 rounded-xl border border-border/80 bg-surface/60 space-y-3">
          <Label htmlFor="targetDate" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <AppIcon icon="calendar" size={14} className="text-brand" />
            <span>Select Target Date</span>
          </Label>

          <Input
            id="targetDate"
            type="date"
            min={minDateStr}
            disabled={isPending}
            className="h-11 text-sm bg-background/80"
            aria-invalid={Boolean(errors.targetDate)}
            {...register("targetDate")}
          />

          {dateContext && (
            <p className="text-xs text-brand font-medium flex items-center gap-1.5">
              <AppIcon icon="clock" size={13} />
              <span>{dateContext}</span>
            </p>
          )}

          {errors.targetDate && (
            <p className="text-xs text-destructive">{errors.targetDate.message}</p>
          )}
        </div>
      )}

      {serverError && (
        <p className="text-xs text-destructive text-center font-medium">{serverError}</p>
      )}

      {/* Action Footer */}
      <OnboardingActions
        continueLabel="Continue"
        backHref="/onboarding/commitment"
        isPending={isPending}
      />
    </form>
  )
}

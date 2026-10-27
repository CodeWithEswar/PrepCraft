"use client"
import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { updatePreferencesSchema, type UpdatePreferencesValues } from "../schemas/target.schema"
import type { ScheduleDetails } from "../types/target.types"
import type { TargetMutationResult } from "../server/mutations"

interface ScheduleEditorProps {
  workspaceId: string
  initialPreferences: ScheduleDetails | null
  onSaveAction: (values: UpdatePreferencesValues) => Promise<TargetMutationResult>
  readOnly?: boolean
}

const STUDY_DAYS = [
  { id: "monday", label: "M" },
  { id: "tuesday", label: "T" },
  { id: "wednesday", label: "W" },
  { id: "thursday", label: "T" },
  { id: "friday", label: "F" },
  { id: "saturday", label: "S" },
  { id: "sunday", label: "S" },
]

const DAILY_MINUTE_OPTIONS = [
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
]

export function ScheduleEditor({
  workspaceId,
  initialPreferences,
  onSaveAction,
  readOnly = false,
}: ScheduleEditorProps) {
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const defaultDays = (initialPreferences?.studyDays as UpdatePreferencesValues["studyDays"]) || [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isDirty },
    reset,
  } = useForm<UpdatePreferencesValues>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: {
      workspaceId,
      weeklyTargetMinutes: initialPreferences?.weeklyTargetMinutes || 600,
      defaultDailyMinutes: initialPreferences?.defaultDailyMinutes || 120,
      studyDays: defaultDays,
      planningMode: initialPreferences?.planningMode || "balanced",
    },
  })

  const currentStudyDays = watch("studyDays") || []
  const currentDailyMinutes = watch("defaultDailyMinutes") || 120
  const currentWeeklyMinutes = watch("weeklyTargetMinutes") || 600

  // Recalculate weekly minutes when days or daily session changes
  const handleDailyMinutesChange = (mins: number) => {
    setValue("defaultDailyMinutes", mins, { shouldDirty: true })
    const computedWeekly = currentStudyDays.length * mins
    setValue("weeklyTargetMinutes", computedWeekly, { shouldDirty: true })
  }

  const handleStudyDaysChange = (days: string[]) => {
    if (days.length === 0) return // keep at least 1 day
    setValue("studyDays", days as UpdatePreferencesValues["studyDays"], { shouldDirty: true })
    const computedWeekly = days.length * currentDailyMinutes
    setValue("weeklyTargetMinutes", computedWeekly, { shouldDirty: true })
  }

  const onSubmit = (values: UpdatePreferencesValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = await onSaveAction(values)
      if (res.success) {
        toast.success("Schedule updated", {
          description: "Weekly preparation commitment and session targets have been saved.",
        })
        reset(values)
      } else {
        setServerError(res.error)
        toast.error("Could not update schedule", { description: res.error })
      }
    })
  }

  const weeklyHours = (currentWeeklyMinutes / 60).toFixed(1).replace(/\.0$/, "")

  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base font-semibold">Study Commitment & Schedule</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Calibrate weekly practice hours and typical daily session targets for this preparation goal.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Active study days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Active Study Days</Label>
              <span className="text-[11px] text-muted-foreground">
                {currentStudyDays.length} day{currentStudyDays.length === 1 ? "" : "s"} selected
              </span>
            </div>
            <Controller
              control={control}
              name="studyDays"
              render={({ field }) => (
                <ToggleGroup
                  value={field.value}
                  onValueChange={handleStudyDaysChange}
                  disabled={readOnly}
                  className="justify-between w-full"
                >
                  {STUDY_DAYS.map((d) => (
                    <ToggleGroupItem
                      key={d.id}
                      value={d.id}
                      className="h-9 w-9 sm:h-10 sm:w-10 text-xs font-semibold p-0"
                    >
                      {d.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
          </div>

          {/* Typical daily session length */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Typical Session Duration</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DAILY_MINUTE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  disabled={readOnly}
                  onClick={() => handleDailyMinutesChange(opt.value)}
                  className={`h-9 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                    currentDailyMinutes === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/70 bg-surface-elevated/40 hover:bg-surface-elevated text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Schedule Math Summary */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-surface-elevated/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{currentStudyDays.length} days</span>
              {" × "}
              <span className="font-semibold text-foreground">
                {(currentDailyMinutes / 60).toFixed(1).replace(/\.0$/, "")}h/day
              </span>
              {" = "}
              <span className="font-semibold text-primary">{weeklyHours} hours/week</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground/70">
              {currentWeeklyMinutes} total minutes
            </span>
          </div>

          {serverError && (
            <p className="text-xs text-destructive font-medium">{serverError}</p>
          )}

          {!readOnly && (
            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <span className="text-[11px] text-muted-foreground">
                {isDirty ? "Unsaved schedule changes" : "All schedule changes saved"}
              </span>
              <Button type="submit" size="sm" disabled={isPending || !isDirty}>
                {isPending ? "Saving schedule..." : "Save schedule"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

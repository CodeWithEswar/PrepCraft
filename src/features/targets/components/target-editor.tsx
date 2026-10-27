"use client"
import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { updateTargetSchema, type UpdateTargetValues } from "../schemas/target.schema"
import { calculateTargetChangeImpact } from "../services/target-impact-service"
import { TargetImpactPreview } from "./target-impact-preview"
import type { CompanyItem, RoleItem, TargetDetails, ScheduleDetails } from "../types/target.types"
import type { TargetMutationResult } from "../server/mutations"

interface TargetEditorProps {
  workspaceId: string
  initialTarget: TargetDetails | null
  preferences: ScheduleDetails | null
  canonicalCompanies: CompanyItem[]
  canonicalRoles: RoleItem[]
  onSaveAction: (values: UpdateTargetValues) => Promise<TargetMutationResult>
  readOnly?: boolean
}

export function TargetEditor({
  workspaceId,
  initialTarget,
  preferences,
  canonicalCompanies,
  canonicalRoles,
  onSaveAction,
  readOnly = false,
}: TargetEditorProps) {
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const defaultRoleFamily =
    (initialTarget?.roleFamily as UpdateTargetValues["roleFamily"]) || "Software Engineer"

  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty, errors },
    reset,
  } = useForm<UpdateTargetValues>({
    resolver: zodResolver(updateTargetSchema),
    defaultValues: {
      workspaceId,
      companyId: initialTarget?.companyId || null,
      companyName: initialTarget?.companyName || "Amazon",
      customCompanyName: initialTarget?.customCompanyName || "",
      roleFamily: defaultRoleFamily,
      roleName: initialTarget?.roleName || "Software Engineer",
      customRoleName: initialTarget?.customRoleName || "",
      preparationLevel: initialTarget?.preparationLevel || "developing",
      interviewLanguage: initialTarget?.interviewLanguage || "java",
      targetDate: initialTarget?.targetDate || "",
    },
  })

  const watchedTargetDate = watch("targetDate")
  const weeklyMinutes = preferences?.weeklyTargetMinutes || 600
  const studyDaysCount = preferences?.studyDays.length || 5

  const changeImpact = calculateTargetChangeImpact({
    targetDate: watchedTargetDate,
    oldTargetDate: initialTarget?.targetDate,
    weeklyTargetMinutes: weeklyMinutes,
    studyDaysCount,
  })

  const onSubmit = (values: UpdateTargetValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = await onSaveAction(values)
      if (res.success) {
        toast.success("Target updated", {
          description: "Career target parameters have been safely saved.",
        })
        reset(values)
      } else {
        setServerError(res.error)
        toast.error("Could not update target", { description: res.error })
      }
    })
  }

  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base font-semibold">Career Target</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Define the role, target company, and interview language this workspace prepares toward.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("workspaceId")} />

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-xs font-medium">Target Company</Label>
              <Input
                id="company-name"
                disabled={readOnly}
                list="canonical-companies"
                placeholder="e.g. Amazon, Google, Microsoft"
                {...register("companyName")}
                className="text-xs sm:text-sm"
              />
              <datalist id="canonical-companies">
                {canonicalCompanies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-name" className="text-xs font-medium">Target Role Title</Label>
              <Input
                id="role-name"
                disabled={readOnly}
                list="canonical-roles"
                placeholder="e.g. Software Engineer, SDE I, Backend Specialist"
                {...register("roleName")}
                className="text-xs sm:text-sm"
              />
              <datalist id="canonical-roles">
                {canonicalRoles.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
              {errors.roleName && (
                <p className="text-xs text-destructive">{errors.roleName.message}</p>
              )}
            </div>
          </div>

          {/* Role Family */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Role Category</Label>
            <select
              disabled={readOnly}
              {...register("roleFamily")}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Software Engineer">Software Engineer (General Algorithms & CS)</option>
              <option value="Backend Engineer">Backend Engineer (APIs, Concurrency & Databases)</option>
              <option value="Frontend Engineer">Frontend Engineer (DOM, React, JS/TS Performance)</option>
              <option value="Full-Stack Engineer">Full-Stack Engineer (End-to-end Systems)</option>
              <option value="Mobile Engineer">Mobile Engineer (iOS / Android Native)</option>
              <option value="Data / ML Engineer">Data / ML Engineer (Pipelines, SQL & Inference)</option>
            </select>
          </div>

          {/* Coding Language & Preparation Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Interview / Coding Language</Label>
              <select
                disabled={readOnly}
                {...register("interviewLanguage")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript_typescript">JavaScript / TypeScript</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Preparation Stage</Label>
              <select
                disabled={readOnly}
                {...register("preparationLevel")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="foundation">Foundation (Building core concepts)</option>
                <option value="developing">Developing (Practicing consistently)</option>
                <option value="interview_preparation">Interview Preparation (Timed & mock practice)</option>
              </select>
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-1.5">
            <Label htmlFor="target-date" className="text-xs font-medium">
              Target Interview Date (Optional)
            </Label>
            <Input
              id="target-date"
              type="date"
              disabled={readOnly}
              {...register("targetDate")}
              className="text-xs w-full sm:w-60"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank if preparing on an open-ended horizon.
            </p>
          </div>

          {/* Change Impact Preview */}
          <TargetImpactPreview impact={changeImpact} />

          {serverError && (
            <p className="text-xs text-destructive font-medium">{serverError}</p>
          )}

          {!readOnly && (
            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <span className="text-[11px] text-muted-foreground">
                {isDirty ? "Unsaved target changes" : "All target changes saved"}
              </span>
              <Button type="submit" size="sm" disabled={isPending || !isDirty}>
                {isPending ? "Saving target..." : "Save target"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

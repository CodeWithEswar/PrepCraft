"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { workspaceStepSchema, type WorkspaceStepValues } from "../schemas/workspace.schema"
import type { PreparationTemplate, MutationResult } from "../types/onboarding.types"
import { suggestWorkspaceName, recommendTemplate } from "../services/template-recommendation"
import { formatMinutesToHours } from "../services/commitment"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AppIcon } from "@/components/app-icon"
import { OnboardingActions } from "./onboarding-actions"
import { cn } from "cn"

interface WorkspaceStepProps {
  draftContext: {
    targetRoleFamily?: string | null
    targetRoleName?: string | null
    targetCompanyName?: string | null
    preferredCodingLanguage?: string | null
    weeklyTargetMinutes?: number | null
    studyDays?: string[] | null
    targetDate?: string | null
    workspaceName?: string | null
    selectedTemplateId?: string | null
  }
  availableTemplates: PreparationTemplate[]
  onCreateAction?: (values: WorkspaceStepValues) => Promise<MutationResult>
}

export function WorkspaceStep({ draftContext, availableTemplates, onCreateAction }: WorkspaceStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const recommendedTemplateId = recommendTemplate(
    draftContext.targetRoleFamily,
    draftContext.targetCompanyName
  )

  const initialWorkspaceName =
    draftContext.workspaceName ||
    suggestWorkspaceName(draftContext.targetRoleName, draftContext.targetCompanyName)

  const initialTemplateId = draftContext.selectedTemplateId || recommendedTemplateId

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
  } = useForm<WorkspaceStepValues>({
    resolver: zodResolver(workspaceStepSchema),
    defaultValues: {
      workspaceName: initialWorkspaceName,
      templateId: initialTemplateId,
    },
  })

  const currentTemplateId = watch("templateId")
  const currentTemplate =
    availableTemplates.find((t) => t.id === currentTemplateId) ||
    availableTemplates[0]

  const onSubmit = (values: WorkspaceStepValues) => {
    setServerError(null)
    startTransition(async () => {
      if (!onCreateAction) {
        setServerError("Creation handler is not available")
        return
      }
      const res = await onCreateAction(values)
      if (!res.success) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msg]) => {
            setError(field as keyof WorkspaceStepValues, { message: String(msg) })
          })
        }
        setServerError(res.error)
      } else if (res.nextUrl) {
        router.push(res.nextUrl)
      }
    })
  }

  const weeklyHours = draftContext.weeklyTargetMinutes
    ? formatMinutesToHours(draftContext.weeklyTargetMinutes) + "/week"
    : "10 hrs/week"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Create your preparation workspace
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          A workspace keeps your curriculum, practice journal, revision queue, and interview signals together.
        </p>
      </div>

      {/* Workspace Name Input */}
      <div className="space-y-1.5">
        <Label htmlFor="workspaceName" className="text-xs font-semibold text-foreground">
          Workspace Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="workspaceName"
          placeholder="e.g. Amazon SDE I"
          disabled={isPending}
          className="h-10 text-sm"
          aria-invalid={Boolean(errors.workspaceName)}
          {...register("workspaceName")}
        />
        {errors.workspaceName && (
          <p className="text-xs text-destructive">{errors.workspaceName.message}</p>
        )}
      </div>

      {/* Preparation Template Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">
            Preparation Template <span className="text-destructive">*</span>
          </Label>
          <span className="text-[0.7rem] text-muted-foreground">Select a starting curriculum</span>
        </div>

        <Controller
          name="templateId"
          control={control}
          render={({ field }) => (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {availableTemplates.map((t) => {
                const isSelected = field.value === t.id
                const isRecommended = t.id === recommendedTemplateId

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => field.onChange(t.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all relative flex flex-col gap-1.5",
                      isSelected
                        ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50 shadow-xs"
                        : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold">{t.name}</span>
                        {isRecommended && (
                          <Badge variant="outline" className="text-[0.6rem] border-brand/40 text-brand bg-brand/10 px-1.5 py-0">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      {isSelected && (
                        <div className="size-4 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                          <AppIcon icon="check" size={10} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {t.description}
                    </span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {t.focusAreas.slice(0, 4).map((f) => (
                        <span key={f} className="text-[0.62rem] px-1.5 py-0.5 rounded bg-surface/80 border border-border/50 text-foreground/80 font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.templateId && (
          <p className="text-xs text-destructive">{errors.templateId.message}</p>
        )}
      </div>

      {/* Summary Box */}
      <div className="p-3.5 rounded-xl border border-border/70 bg-surface/60 space-y-2 text-xs">
        <p className="font-semibold text-foreground text-[0.72rem] uppercase tracking-wider">
          Workspace Summary
        </p>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div>
            <span className="text-[0.68rem] text-muted-foreground/80 block">Role & Company</span>
            <span className="font-medium text-foreground">
              {draftContext.targetCompanyName ? `${draftContext.targetCompanyName} · ` : ""}
              {draftContext.targetRoleName || "Software Engineer"}
            </span>
          </div>
          <div>
            <span className="text-[0.68rem] text-muted-foreground/80 block">Language</span>
            <span className="font-medium text-foreground capitalize">
              {draftContext.preferredCodingLanguage || "Java"}
            </span>
          </div>
          <div>
            <span className="text-[0.68rem] text-muted-foreground/80 block">Commitment</span>
            <span className="font-medium text-foreground">{weeklyHours}</span>
          </div>
          <div>
            <span className="text-[0.68rem] text-muted-foreground/80 block">Curriculum</span>
            <span className="font-medium text-foreground">{currentTemplate?.name}</span>
          </div>
        </div>
      </div>

      {serverError && (
        <p className="text-xs text-destructive text-center font-medium">{serverError}</p>
      )}

      {/* Action Footer */}
      <OnboardingActions
        continueLabel="Create workspace & plan"
        backHref="/onboarding/target-date"
        isPending={isPending}
      />
    </form>
  )
}

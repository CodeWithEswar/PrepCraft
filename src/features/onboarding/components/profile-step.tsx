"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileStepSchema, type ProfileStepValues } from "../schemas/profile.schema"
import type { MutationResult } from "../types/onboarding.types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OnboardingActions } from "./onboarding-actions"

interface ProfileStepProps {
  initialValues: {
    displayName: string | null
    avatarUrl: string | null
    collegeName: string | null
    graduationYear: number | null
  }
  onSaveAction?: (values: ProfileStepValues) => Promise<MutationResult>
}

export function ProfileStep({ initialValues, onSaveAction }: ProfileStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: {
      displayName: initialValues.displayName || "",
      collegeName: initialValues.collegeName || "",
      graduationYear: initialValues.graduationYear || undefined,
    },
  })

  const onSubmit = (values: ProfileStepValues) => {
    setServerError(null)
    startTransition(async () => {
      const res: MutationResult = onSaveAction
        ? await onSaveAction(values)
        : { success: true, nextUrl: "/onboarding/target" }
      if (!res.success) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msg]) => {
            setError(field as keyof ProfileStepValues, { message: String(msg) })
          })
        }
        setServerError(res.error)
      } else if (res.nextUrl) {
        router.push(res.nextUrl)
      }
    })
  }

  const fallbackInitial = (initialValues.displayName || "U")[0].toUpperCase()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          A little about you
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          How you&apos;d like your candidate identity to appear throughout your preparation.
        </p>
      </div>

      {/* Avatar & Display Details */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-border/60 bg-surface/50">
        <Avatar size="lg" className="size-16 sm:size-18 border-2 border-border/80 shadow-xs">
          {initialValues.avatarUrl && (
            <AvatarImage src={initialValues.avatarUrl} alt={initialValues.displayName || "Avatar"} />
          )}
          <AvatarFallback className="text-lg font-semibold bg-brand/10 text-brand">
            {fallbackInitial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 w-full space-y-1.5 text-center sm:text-left">
          <Label htmlFor="displayName" className="text-xs font-semibold text-foreground">
            Display name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="displayName"
            placeholder="e.g. Alex Morgan"
            disabled={isPending}
            className="h-10 text-sm"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>
      </div>

      {/* College & Graduation Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="collegeName" className="text-xs font-medium text-foreground">
            College / University <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="collegeName"
            placeholder="e.g. Stanford University"
            disabled={isPending}
            className="h-10 text-sm"
            aria-invalid={Boolean(errors.collegeName)}
            {...register("collegeName")}
          />
          {errors.collegeName && (
            <p className="text-xs text-destructive">{errors.collegeName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="graduationYear" className="text-xs font-medium text-foreground">
            Graduation year <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="graduationYear"
            type="number"
            placeholder="e.g. 2025"
            min={1980}
            max={2100}
            disabled={isPending}
            className="h-10 text-sm"
            aria-invalid={Boolean(errors.graduationYear)}
            {...register("graduationYear")}
          />
          {errors.graduationYear && (
            <p className="text-xs text-destructive">{errors.graduationYear.message}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="text-xs text-destructive text-center font-medium">{serverError}</p>
      )}

      {/* Action Footer */}
      <OnboardingActions
        continueLabel="Continue"
        backHref="/onboarding/welcome"
        isPending={isPending}
      />
    </form>
  )
}

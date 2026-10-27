"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { languageStepSchema, type LanguageStepValues } from "../schemas/language.schema"
import type { CodingLanguage, MutationResult } from "../types/onboarding.types"
import { AppIcon } from "@/components/app-icon"
import { OnboardingActions } from "./onboarding-actions"
import { cn } from "cn"

interface LanguageStepProps {
  initialLanguage?: CodingLanguage | null
  onSaveAction?: (values: LanguageStepValues) => Promise<MutationResult>
}

const LANGUAGE_OPTIONS: Array<{
  id: CodingLanguage
  title: string
  subtitle: string
  popularFor: string
}> = [
  {
    id: "java",
    title: "Java",
    subtitle: "Enterprise systems, Spring, Android & OOP fundamentals",
    popularFor: "Amazon, Google & enterprise engineering",
  },
  {
    id: "python",
    title: "Python",
    subtitle: "Rapid prototyping, data structures & clean syntax",
    popularFor: "Data/ML, startups & fast algorithmic practice",
  },
  {
    id: "cpp",
    title: "C++",
    subtitle: "High-performance systems, STL & memory control",
    popularFor: "Systems, gaming, quant & Qualcomm",
  },
  {
    id: "javascript",
    title: "JavaScript / TypeScript",
    subtitle: "Full-stack apps, async event loops & modern web engines",
    popularFor: "Frontend, Full-stack & Node backend",
  },
  {
    id: "other",
    title: "Other / Language Agnostic",
    subtitle: "Go, Rust, C#, Swift or general pseudocode",
    popularFor: "Niche domains or multi-language teams",
  },
]

export function LanguageStep({ initialLanguage, onSaveAction }: LanguageStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LanguageStepValues>({
    resolver: zodResolver(languageStepSchema),
    defaultValues: {
      preferredCodingLanguage: initialLanguage || "java",
    },
  })

  const onSubmit = (values: LanguageStepValues) => {
    setServerError(null)
    startTransition(async () => {
      const res: MutationResult = onSaveAction
        ? await onSaveAction(values)
        : { success: true, nextUrl: "/onboarding/commitment" }
      if (!res.success) {
        setServerError(res.error)
      } else if (res.nextUrl) {
        router.push(res.nextUrl)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Choose your primary interview language
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          We&apos;ll calibrate standard libraries, problem solutions, and code execution around this language.
        </p>
      </div>

      {/* Language Options Grid */}
      <Controller
        name="preferredCodingLanguage"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = field.value === lang.id
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => field.onChange(lang.id)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5",
                    isSelected
                      ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50 shadow-xs"
                      : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold tracking-tight">{lang.title}</span>
                    {isSelected && (
                      <div className="size-4 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                        <AppIcon icon="check" size={10} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground leading-snug">
                    {lang.subtitle}
                  </span>
                  <span className="text-[0.68rem] text-brand/90 font-medium pt-1 border-t border-border/40">
                    {lang.popularFor}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      />

      {errors.preferredCodingLanguage && (
        <p className="text-xs text-destructive text-center">{errors.preferredCodingLanguage.message}</p>
      )}

      {/* Supporting context note */}
      <div className="p-3 rounded-lg border border-border/40 bg-surface/40 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
        <AppIcon icon="info" size={15} className="text-brand shrink-0 mt-0.5" />
        <p>
          You can change your default coding language at any time in workspace settings without losing past attempts.
        </p>
      </div>

      {serverError && (
        <p className="text-xs text-destructive text-center font-medium">{serverError}</p>
      )}

      {/* Action Footer */}
      <OnboardingActions
        continueLabel="Continue"
        backHref="/onboarding/target"
        isPending={isPending}
      />
    </form>
  )
}

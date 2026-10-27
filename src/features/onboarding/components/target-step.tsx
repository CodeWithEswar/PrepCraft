"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { targetStepSchema, type TargetStepValues } from "../schemas/target.schema"
import type { RoleFamily, MutationResult } from "../types/onboarding.types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AppIcon } from "@/components/app-icon"
import { OnboardingActions } from "./onboarding-actions"
import { cn } from "cn"

interface TargetStepProps {
  initialValues?: {
    roleFamily?: RoleFamily | null
    roleName?: string | null
    targetCompanyId?: string | null
    customCompanyName?: string | null
  }
  onSaveAction?: (values: TargetStepValues) => Promise<MutationResult>
}

const ROLE_FAMILIES: Array<{ id: RoleFamily; label: string; desc: string }> = [
  { id: "Software Engineer", label: "Software Engineer", desc: "Core algorithms, data structures & general systems" },
  { id: "Backend Engineer", label: "Backend Engineer", desc: "APIs, databases, concurrency & distributed architectures" },
  { id: "Frontend Engineer", label: "Frontend Engineer", desc: "JavaScript/TypeScript, DOM, React & web performance" },
  { id: "Full-Stack Engineer", label: "Full-Stack Engineer", desc: "End-to-end applications, client state & backend services" },
  { id: "Mobile Engineer", label: "Mobile Engineer", desc: "iOS, Android, native performance & app state" },
  { id: "Data / ML Engineer", label: "Data / ML Engineer", desc: "Pipelines, SQL, model serving & distributed data" },
]

const COMPANY_OPTIONS = [
  { id: "none", label: "General preparation", desc: "No specific company" },
  { id: "Amazon", label: "Amazon", desc: "OA, DSA & Leadership Principles" },
  { id: "Google", label: "Google", desc: "Algorithms, complexity & Googleyness" },
  { id: "Microsoft", label: "Microsoft", desc: "Data structures & system thinking" },
  { id: "Cisco", label: "Cisco", desc: "Networks, systems & core CS" },
  { id: "Qualcomm", label: "Qualcomm", desc: "Embedded, hardware-software & C++" },
  { id: "other", label: "Other company", desc: "Enter a custom company name" },
]

export function TargetStep({ initialValues, onSaveAction }: TargetStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const defaultCompany = initialValues?.customCompanyName
    ? "other"
    : initialValues?.targetCompanyId || "none"

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setError,
    setValue,
  } = useForm<TargetStepValues>({
    resolver: zodResolver(targetStepSchema),
    defaultValues: {
      roleFamily: (initialValues?.roleFamily as RoleFamily) || "Software Engineer",
      roleName: initialValues?.roleName || "Software Engineer",
      companySelection: defaultCompany,
      customCompanyName: initialValues?.customCompanyName || "",
    },
  })

  const selectedCompany = watch("companySelection")

  const onSubmit = (values: TargetStepValues) => {
    setServerError(null)
    startTransition(async () => {
      const res: MutationResult = onSaveAction
        ? await onSaveAction(values)
        : { success: true, nextUrl: "/onboarding/language" }
      if (!res.success) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msg]) => {
            setError(field as keyof TargetStepValues, { message: String(msg) })
          })
        }
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
          What are you preparing for?
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Select your primary target track so PrepCraft can calibrate your curriculum.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">
          Target Role Family <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="roleFamily"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLE_FAMILIES.map((r) => {
                const isSelected = field.value === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      field.onChange(r.id)
                      setValue("roleName", r.label)
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1",
                      isSelected
                        ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50 shadow-xs"
                        : "border-border/70 bg-surface/50 hover:bg-surface-elevated/70 text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-semibold">{r.label}</span>
                      {isSelected && (
                        <div className="size-4 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                          <AppIcon icon="check" size={10} />
                        </div>
                      )}
                    </div>
                    <span className="text-[0.68rem] text-muted-foreground leading-tight">
                      {r.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.roleFamily && (
          <p className="text-xs text-destructive">{errors.roleFamily.message}</p>
        )}
      </div>

      {/* Target Company Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">
          Target Company <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Controller
          name="companySelection"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMPANY_OPTIONS.map((c) => {
                const isSelected = field.value === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => field.onChange(c.id)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-0.5",
                      isSelected
                        ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50"
                        : "border-border/60 bg-surface/40 hover:bg-surface-elevated/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium">{c.label}</span>
                      {isSelected && (
                        <div className="size-3.5 rounded-full bg-brand text-primary-foreground flex items-center justify-center shrink-0">
                          <AppIcon icon="check" size={8} />
                        </div>
                      )}
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground leading-tight line-clamp-1">
                      {c.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />

        {/* Custom Company input when "other" is selected */}
        {selectedCompany === "other" && (
          <div className="pt-1.5 space-y-1">
            <Label htmlFor="customCompanyName" className="text-xs font-medium text-foreground">
              Company Name
            </Label>
            <Input
              id="customCompanyName"
              placeholder="e.g. Stripe, Uber, Adobe"
              disabled={isPending}
              className="h-10 text-sm"
              {...register("customCompanyName")}
            />
          </div>
        )}
      </div>

      {serverError && (
        <p className="text-xs text-destructive text-center font-medium">{serverError}</p>
      )}

      {/* Action Footer */}
      <OnboardingActions
        continueLabel="Continue"
        backHref="/onboarding/profile"
        isPending={isPending}
      />
    </form>
  )
}

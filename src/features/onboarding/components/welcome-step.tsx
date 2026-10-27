"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { PrepCraftSymbol } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import type { MutationResult } from "../types/onboarding.types"

interface WelcomeStepProps {
  onSaveAction?: () => Promise<MutationResult>
}

export function WelcomeStep({ onSaveAction }: WelcomeStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const handleStart = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res: MutationResult = onSaveAction
          ? await onSaveAction()
          : { success: true, nextUrl: "/onboarding/profile" }
        if (!res.success) {
          setError(res.error)
        } else if (res.nextUrl) {
          router.push(res.nextUrl)
        }
      } catch {
        // Fallback navigation if server action encounters client network glitch
        router.push("/onboarding/profile")
      }
    })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Brand header icon */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-center justify-center p-3 rounded-2xl bg-surface-elevated/80 border border-border/70 shadow-xs">
          <PrepCraftSymbol size={44} appearance="auto" decorative />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Your preparation starts here.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            PrepCraft will build a tailored workspace around your role, available schedule, target date, and preparation trajectory.
          </p>
        </div>
      </div>

      {/* Product Loop visual sequence */}
      <div className="p-4 rounded-xl border border-border/60 bg-surface/60 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 text-center">
          The Preparation Loop
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { label: "Plan", desc: "Targeted curriculum", icon: "calendar" as const },
            { label: "Practice", desc: "Deliberate attempts", icon: "code" as const },
            { label: "Revise", desc: "Spaced reflection", icon: "book" as const },
            { label: "Interview", desc: "Verified readiness", icon: "check-circle" as const },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-lg border border-border/50 bg-surface-elevated/40 flex flex-col items-center space-y-1.5 transition-all hover:border-brand/40"
            >
              <div className="size-7 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                <AppIcon icon={item.icon} size={15} />
              </div>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
              <span className="text-[0.68rem] text-muted-foreground leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Privacy Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/40 bg-surface/40 text-xs text-muted-foreground leading-relaxed">
        <AppIcon icon="shield" size={16} className="text-brand shrink-0 mt-0.5" />
        <p>
          Your preparation progress is private to your account and the workspaces you create or are invited to.
        </p>
      </div>

      {error && (
        <p className="text-xs text-destructive text-center font-medium">{error}</p>
      )}

      {/* Primary CTA */}
      <div className="pt-2">
        <Button
          variant="default"
          size="lg"
          onClick={handleStart}
          loading={isPending}
          disabled={isPending}
          className="w-full h-12 text-sm sm:text-base font-medium shadow-xs active:scale-[0.99] gap-2"
        >
          <span>Set up my workspace</span>
          {!isPending && <AppIcon icon="arrow-right" size={16} />}
        </Button>
      </div>
    </div>
  )
}

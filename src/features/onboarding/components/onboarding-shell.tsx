"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"
import type { OnboardingStage } from "../types/onboarding.types"
import { OnboardingHeader } from "./onboarding-header"
import { OnboardingProgress } from "./onboarding-progress"
import { AppIcon } from "@/components/app-icon"
import { cn } from "cn"

interface OnboardingShellProps {
  currentStage: OnboardingStage
  children: React.ReactNode
  className?: string
  cardClassName?: string
  onSaveAndExit?: () => void
  onSave?: () => Promise<void> | void
}

function OnboardingThemeToggle() {
  const mounted = React.useSyncExternalStore(() => () => {}, () => true, () => false)
  const { theme, setTheme } = useTheme()



  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-surface/50 p-0.5">
      {(["light", "dark", "system"] as const).map((mode) => {
        const isActive = mounted && theme === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-label={`Switch to ${mode} theme`}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.68rem] font-medium transition-all",
              isActive
                ? "bg-surface-elevated text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <AppIcon
              icon={mode === "light" ? "sun" : mode === "dark" ? "moon" : "system"}
              size={11}
            />
            <span className="capitalize">{mode}</span>
          </button>
        )
      })}
    </div>
  )
}

export function OnboardingShell({
  currentStage,
  children,
  className,
  cardClassName,
  onSaveAndExit,
  onSave,
}: OnboardingShellProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col justify-between bg-background text-foreground selection:bg-brand/20 selection:text-foreground relative overflow-x-hidden",
        className
      )}
    >
      {/* Ambient background glow matching PrepCraft auth and marketing design */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[600px] max-w-full rounded-full bg-brand/10 blur-[120px] dark:bg-brand/12" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(161,95,75,0.06),transparent)]" />
      </div>

      {/* Onboarding Navigation Header */}
      <OnboardingHeader onSaveAndExit={onSaveAndExit} onSave={onSave} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center relative z-10">
        {/* Progress Navigation Indicator */}
        <OnboardingProgress currentStage={currentStage} className="mb-4 sm:mb-6" />

        {/* Step Card Container */}
        <motion.div
          key={currentStage}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className={cn(
            "w-full max-w-[560px] relative rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-2xl shadow-xl p-6 sm:p-8 space-y-6 transition-all",
            cardClassName
          )}
        >
          {/* Delicate top specular highlight */}
          <div
            className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent"
            aria-hidden="true"
          />

          {children}
        </motion.div>
      </main>

      {/* Subtle brand footer */}
      <footer className="relative z-10 w-full py-4 px-4 sm:px-6 border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[0.75rem] text-muted-foreground/60 select-none">
          <span>PrepCraft · Personalizing your preparation trajectory</span>
          <OnboardingThemeToggle />
        </div>
      </footer>
    </div>
  )
}

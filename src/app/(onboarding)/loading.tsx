import * as React from "react"
import { Loader2Icon } from "@/components/app-icon/ui-icons"

export default function OnboardingLoading() {
  return (
    <div className="min-h-dvh flex flex-col justify-between bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[640px] max-w-full rounded-full bg-primary/10 blur-[120px] dark:bg-primary/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(161,95,75,0.08),rgba(255,255,255,0))]" />
      </div>

      {/* Edge-to-edge header skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="h-7 w-28 rounded-md bg-muted/40 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8.5 w-16 sm:w-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-8.5 w-16 sm:w-20 rounded-lg bg-muted/30 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main card loading skeleton */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 w-full my-auto">
        <div className="w-full max-w-[560px] rounded-2xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[360px] text-center space-y-4">
          <Loader2Icon
            size={28}
            className="animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/80">
            Loading preparation workspace...
          </p>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 w-full py-4 text-center">
        <span className="text-xs text-muted-foreground/60">PrepCraft · Server-authoritative preparation</span>
      </footer>
    </div>
  )
}

import * as React from "react"
import { AuthHeader } from "@/features/auth"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh flex flex-col justify-between bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-foreground">
      {/* Ambient background glow and mineral grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[640px] max-w-full rounded-full bg-primary/10 blur-[120px] dark:bg-primary/15"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(161,95,75,0.08),rgba(255,255,255,0))]"
        />
      </div>

      {/* Restrained header */}
      <div className="relative z-10">
        <AuthHeader />
      </div>

      {/* Centered card surface */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 w-full my-auto">
        {children}
      </main>

      {/* Subtle brand footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-muted-foreground/60 select-none">
        <p>PrepCraft · Craft your way to ready.</p>
      </footer>
    </div>
  )
}

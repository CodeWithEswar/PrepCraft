import * as React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PrepCraftLogo } from "@/components/brand"
import { AppIcon } from "@/components/app-icon"

export const instant = false

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?returnTo=/settings/workspaces")
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[640px] max-w-full rounded-full bg-primary/8 blur-[140px] dark:bg-primary/12" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(161,95,75,0.06),rgba(255,255,255,0))]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 h-14 px-4 sm:px-6 lg:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PrepCraftLogo size="sm" />
          <div className="h-4 w-px bg-border/80" />
          <span className="text-xs font-medium text-muted-foreground">Settings</span>
        </div>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <AppIcon icon="arrow-left" size="xs" />
          <span>Back to dashboard</span>
        </Link>
      </header>

      {/* Main Settings Content */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}

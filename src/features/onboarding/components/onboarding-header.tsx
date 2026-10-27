"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PrepCraftLogo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { cn } from "cn"

interface OnboardingHeaderProps {
  onSaveAndExit?: () => void
  onSave?: () => Promise<void> | void
}

export function OnboardingHeader({ onSaveAndExit, onSave }: OnboardingHeaderProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      if (onSave) {
        await onSave()
      }
      setIsSaved(true)
      setTimeout(() => {
        setIsSaved(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to save onboarding progress:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExit = async () => {
    if (onSaveAndExit) {
      onSaveAndExit()
    } else {
      if (onSave) {
        try {
          await onSave()
        } catch {
          // ignore error to ensure exit continues
        }
      }
      router.push("/")
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-2xs">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          aria-label="PrepCraft Home"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-opacity hover:opacity-90"
        >
          <PrepCraftLogo size={32} appearance="auto" />
        </Link>

        <div className="flex items-center gap-2">
          {/* Save Action with Icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            aria-label={isSaved ? "Progress saved" : isSaving ? "Saving progress..." : "Save progress"}
            title={isSaved ? "Progress saved!" : "Save progress"}
            className={cn(
              "h-8.5 px-2.5 sm:px-3 rounded-lg border text-xs font-medium gap-1.5 transition-all cursor-pointer shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSaved
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-border/60 bg-surface/50 hover:bg-surface-elevated hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <AppIcon
              icon={isSaved ? "check" : isSaving ? "spinner" : "save"}
              size={14}
              className={cn(
                "transition-colors",
                isSaved && "text-emerald-500",
                isSaving && "animate-spin text-brand"
              )}
            />
            <span className="hidden sm:inline">
              {isSaved ? "Saved" : isSaving ? "Saving..." : "Save"}
            </span>
          </Button>

          {/* Exit Action with Icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            aria-label="Exit onboarding"
            title="Exit onboarding"
            className="h-8.5 px-2.5 sm:px-3 rounded-lg border border-border/60 bg-surface/50 hover:bg-surface-elevated hover:border-border text-muted-foreground hover:text-foreground text-xs font-medium gap-1.5 transition-all cursor-pointer shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AppIcon
              icon="exit"
              size={14}
              className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5"
            />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

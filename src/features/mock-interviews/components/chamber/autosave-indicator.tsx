"use client"

import { AppIcon } from "@/components/app-icon"

export type AutosaveStatus = "saved" | "saving" | "offline" | "failed"

interface AutosaveIndicatorProps {
  status: AutosaveStatus
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
        <AppIcon icon="spinner" size={12} className="animate-spin" />
        <span>Saving…</span>
      </span>
    )
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium">
        <AppIcon icon="alert" size={12} />
        <span>Save failed</span>
      </span>
    )
  }

  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
        <AppIcon icon="alert-circle" size={12} />
        <span>Offline draft</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
      <AppIcon icon="check" size={12} className="text-emerald-500" />
      <span>Saved</span>
    </span>
  )
}

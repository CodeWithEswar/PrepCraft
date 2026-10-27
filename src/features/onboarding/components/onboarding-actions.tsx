"use client"
import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { cn } from "cn"

interface OnboardingActionsProps {
  continueLabel?: string
  backHref?: string
  onBack?: () => void
  isPending?: boolean
  disabled?: boolean
  className?: string
  showBack?: boolean
}

export function OnboardingActions({
  continueLabel = "Continue",
  backHref,
  onBack,
  isPending = false,
  disabled = false,
  className,
  showBack = true,
}: OnboardingActionsProps) {
  return (
    <div
      className={cn(
        "pt-4 flex items-center justify-between gap-3 border-t border-border/50",
        !showBack && "justify-end",
        className
      )}
    >
      {showBack && (
        <>
          {backHref ? (
            <Button
              variant="ghost"
              size="default"
              type="button"
              nativeButton={false}
              render={<Link href={backHref} />}
              disabled={isPending}
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5"
            >
              <AppIcon icon="arrow-left" size={14} />
              <span>Back</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="default"
              type="button"
              onClick={onBack}
              disabled={isPending || !onBack}
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5"
            >
              <AppIcon icon="arrow-left" size={14} />
              <span>Back</span>
            </Button>
          )}
        </>
      )}

      <Button
        variant="default"
        size="lg"
        type="submit"
        loading={isPending}
        disabled={disabled || isPending}
        className="ml-auto min-w-[140px] font-medium gap-2 shadow-xs active:scale-[0.99] transition-all bg-primary hover:bg-brand-hover text-primary-foreground"
      >
        <span>{continueLabel}</span>
        {!isPending && <AppIcon icon="arrow-right" size={16} />}
      </Button>
    </div>
  )
}

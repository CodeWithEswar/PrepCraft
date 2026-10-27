"use client"
import * as React from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import type { LastUsedAccountHint } from "../types/auth.types"

interface RememberedAccountProps {
  hint: LastUsedAccountHint
  onClear: () => void
  onSwitchAccount: () => void
}

export function RememberedAccount({
  hint,
  onClear,
  onSwitchAccount,
}: RememberedAccountProps) {
  return (
    <div className="w-full space-y-3 pt-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground/80 px-0.5">
        <span className="font-medium tracking-wide">Last used on this device</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8.5 rounded-lg bg-surface-elevated border border-border/60 flex items-center justify-center text-xs font-semibold text-foreground shrink-0 overflow-hidden">
            {hint.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hint.avatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span>{hint.displayName ? hint.displayName[0]?.toUpperCase() : "C"}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            {hint.displayName && (
              <span className="text-xs font-medium text-foreground truncate">
                {hint.displayName}
              </span>
            )}
            <span className="text-xs text-muted-foreground truncate font-mono">
              {hint.maskedEmail}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onSwitchAccount}
          className="text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 shrink-0 h-8 px-2.5 rounded-lg"
        >
          <span>Not you?</span>
          <AppIcon icon="arrow-right" size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}

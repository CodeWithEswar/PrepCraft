"use client"
import * as React from "react"
import { PrepCraftSymbol } from "@/components/brand"
import { AppIcon } from "@/components/app-icon"
import { GoogleAuthButton } from "./google-auth-button"
import { RememberedAccount } from "./remembered-account"
import { AuthError } from "./auth-error"
import { SessionExpiredAlert } from "./session-expired"
import { AccessRevokedAlert } from "./access-revoked"
import {
  getRememberedAccount,
  clearRememberedAccount,
  subscribeToRememberedAccount,
} from "../utils/remembered-account"

interface LoginFormProps {
  returnTo?: string
  reason?: "session_expired" | "access_revoked" | "oauth_failed" | "unauthenticated"
  error?: string
  workspaceSlug?: string
}

export function LoginForm({
  returnTo,
  reason,
  error,
  workspaceSlug,
}: LoginFormProps) {
  const rememberedHint = React.useSyncExternalStore(
    subscribeToRememberedAccount,
    getRememberedAccount,
    () => null
  )
  const [forceNewAccount, setForceNewAccount] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(error || null)

  const handleClearHint = () => {
    clearRememberedAccount()
    setForceNewAccount(false)
  }

  const handleSwitchAccount = () => {
    setForceNewAccount(true)
  }

  const isReturning = Boolean(rememberedHint && !forceNewAccount)

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Mineral glass card */}
      <div className="relative rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-2xl shadow-xl p-6 sm:p-8 space-y-6 transition-all">
        {/* Subtle top ambient highlight */}
        <div
          className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          aria-hidden="true"
        />

        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center justify-center p-2 rounded-2xl bg-surface-elevated/70 border border-border/60 shadow-xs">
            <PrepCraftSymbol size={36} appearance="auto" decorative />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {isReturning ? "Welcome back" : "Welcome to PrepCraft"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Continue where your preparation left off.
            </p>
          </div>
        </div>

        {/* Contextual alerts */}
        <div className="space-y-3">
          {reason === "session_expired" && <SessionExpiredAlert />}
          {reason === "access_revoked" && <AccessRevokedAlert workspaceSlug={workspaceSlug} />}
          {localError && (
            <AuthError
              message={localError}
              onRetry={() => setLocalError(null)}
            />
          )}
        </div>

        {/* Primary Action Area */}
        <div className="space-y-4">
          <GoogleAuthButton
            returnTo={returnTo}
            forceAccountSelection={forceNewAccount}
            label={isReturning ? "Continue with Google" : "Continue with Google"}
            onAuthError={(err) => setLocalError(err.message)}
          />

          {/* Returning user card on this device */}
          {rememberedHint && !forceNewAccount && (
            <RememberedAccount
              hint={rememberedHint}
              onClear={handleClearHint}
              onSwitchAccount={handleSwitchAccount}
            />
          )}

          {/* Switch account active note */}
          {forceNewAccount && rememberedHint && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
              <span>Selecting a different Google account</span>
              <button
                type="button"
                onClick={() => setForceNewAccount(false)}
                className="text-primary hover:underline underline-offset-4 cursor-pointer font-medium"
              >
                Use saved hint
              </button>
            </div>
          )}
        </div>

        {/* Security & Privacy Microcopy */}
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-start gap-2 text-left">
            <AppIcon icon="shield" size={14} className="text-primary/80 mt-0.5 shrink-0" />
            <p className="text-[0.7rem] text-muted-foreground/80 leading-normal">
              Your preparation data stays private to your account and authorized workspaces.
              Protected by secure authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

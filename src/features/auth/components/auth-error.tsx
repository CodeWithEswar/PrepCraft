"use client"
import * as React from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"

interface AuthErrorProps {
  message?: string
  errorReason?: string
  onRetry?: () => void
}

const ERROR_DESCRIPTIONS: Record<string, string> = {
  OAUTH_CANCELLED: "Sign-in was cancelled. Choose your Google account to proceed.",
  OAUTH_PROVIDER_ERROR: "Google authentication service encountered a temporary error. Please try again.",
  CALLBACK_INVALID: "Authentication response could not be verified. Please start sign-in again.",
  SESSION_EXCHANGE_FAILED: "We were unable to establish your secure session. Please try again.",
  NETWORK_ERROR: "Network connectivity issue detected. Check your connection and try again.",
  UNEXPECTED_AUTH_ERROR: "An unexpected error occurred during authentication. Please retry.",
}

export function AuthError({ message, errorReason, onRetry }: AuthErrorProps) {
  const displayMessage =
    message ||
    (errorReason && ERROR_DESCRIPTIONS[errorReason]) ||
    "We could not complete your sign-in. Your session was not created."

  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive text-left">
      <AppIcon icon="alert-circle" size={16} className="text-destructive mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <AlertTitle className="text-sm font-semibold tracking-tight">Sign-in incomplete</AlertTitle>
        <AlertDescription className="text-xs text-destructive/90 leading-relaxed">
          {displayMessage}
        </AlertDescription>
        {onRetry && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="xs"
              type="button"
              onClick={onRetry}
              className="text-xs border-destructive/40 text-destructive hover:bg-destructive/15"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </Alert>
  )
}

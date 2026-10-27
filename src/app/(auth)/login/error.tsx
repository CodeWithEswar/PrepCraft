"use client"
import * as React from "react"
import { AuthError } from "@/features/auth"

export default function LoginError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="w-full max-w-[420px] mx-auto rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-2xl shadow-xl p-8 space-y-4">
      <AuthError
        message="An unexpected error occurred while preparing sign in."
        onRetry={reset}
      />
    </div>
  )
}

import * as React from "react"
import { Spinner } from "@/components/ui/spinner"

interface AuthResolvingProps {
  heading?: string
  subheading?: string
}

export function AuthResolving({
  heading = "Preparing your workspace",
  subheading = "Verifying session and authorized workspaces…",
}: AuthResolvingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-5"
    >
      <div className="relative flex items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {heading}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {subheading}
        </p>
      </div>
    </div>
  )
}

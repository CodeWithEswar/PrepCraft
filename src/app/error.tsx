"use client"

import { useEffect } from "react"
import Link from "next/link"
import { PrepCraftLogo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { captureException } from "@sentry/nextjs"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error,{tags:{code:"route_error"}})
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <PrepCraftLogo size={48} decorative />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-destructive font-semibold">Unexpected condition</p>
          <h1 className="text-2xl font-semibold tracking-tight">Something interrupted this session.</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PrepCraft encountered an unexpected error. You can try refreshing the action or navigating back.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono">Digest: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Go to home
          </Button>
          <Button onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}

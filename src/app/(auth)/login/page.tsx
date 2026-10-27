import type { Metadata } from "next"
import { LoginForm, sanitizeReturnPath } from "@/features/auth"

export const metadata: Metadata = {
  title: "Sign in — PrepCraft",
  description: "Sign in securely with Google to continue your software engineering preparation.",
  robots: {
    index: false,
    follow: false,
  },
}

interface LoginPageProps {
  searchParams: Promise<{
    returnTo?: string
    reason?: "session_expired" | "access_revoked" | "oauth_failed" | "unauthenticated"
    error?: string
    workspace?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const safeReturnTo = params.returnTo ? sanitizeReturnPath(params.returnTo) : undefined

  return (
    <LoginForm
      returnTo={safeReturnTo}
      reason={params.reason}
      error={params.error}
      workspaceSlug={params.workspace}
    />
  )
}

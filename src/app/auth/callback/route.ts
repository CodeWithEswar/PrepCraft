import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeReturnPath } from "@/features/auth"
import { resolveAuthenticatedUser } from "@/features/auth/server"
import { logEvent } from "@/lib/observability/logger.server"

/**
 * OAuth Callback Handler for Supabase Auth (Google OAuth).
 * Exchanges the authorization code for a session and delegates to the
 * server post-auth destination resolver.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const rawReturnTo = requestUrl.searchParams.get("returnTo")
  const safeReturnTo = sanitizeReturnPath(rawReturnTo, "/")

  // 1. Handle OAuth provider errors
  if (error) {
    logEvent("warn", "oauth_callback_error", { code: "unauthenticated" })
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "oauth_failed")
    loginUrl.searchParams.set(
      "error",
      "Google sign-in was cancelled or encountered an error. Please try again."
    )
    if (safeReturnTo !== "/") {
      loginUrl.searchParams.set("returnTo", safeReturnTo)
    }
    return NextResponse.redirect(loginUrl)
  }

  // 2. Validate authorization code
  if (!code) {
    logEvent("warn", "oauth_callback_missing_code", { code: "validation" })
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "oauth_failed")
    loginUrl.searchParams.set("error", "Invalid authorization response received.")
    return NextResponse.redirect(loginUrl)
  }

  // 3. Exchange authorization code for authenticated session
  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    logEvent("error", "oauth_exchange_failed", { code: "unauthenticated" })
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "oauth_failed")
    loginUrl.searchParams.set("error", "Unable to establish secure session.")
    return NextResponse.redirect(loginUrl)
  }

  logEvent("info", "oauth_session_established", {})

  // 4. Resolve candidate destination via server-authoritative resolver
  const resolution = await resolveAuthenticatedUser(safeReturnTo !== "/" ? safeReturnTo : null)

  const destinationUrl = new URL(resolution.destination, request.url)
  return NextResponse.redirect(destinationUrl)
}

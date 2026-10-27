import "server-only"
import { createClient } from "@/lib/supabase/server"
import { getUserWorkspaces, ensureUserProfile } from "./queries"
import { resolvePostAuthDestination } from "../services/post-auth-resolver"
import type { PostAuthResolution } from "../types/auth.types"
import { logEvent } from "@/lib/observability/logger.server"

/**
 * Server-authoritative post-auth destination resolver.
 * Evaluates active session, bootstraps profile, checks onboarding status,
 * and verifies active workspace memberships.
 */
export async function resolveAuthenticatedUser(
  requestedReturnTo?: string | null
): Promise<PostAuthResolution> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      status: "UNAUTHENTICATED",
      destination: "/login",
    }
  }

  // Ensure profile exists in PostgreSQL
  const profile = await ensureUserProfile({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  })

  // Query user's workspaces
  const workspaces = await getUserWorkspaces(user.id)

  const resolution = resolvePostAuthDestination({
    userId: user.id,
    profile,
    workspaces,
    requestedReturnTo,
  })

  logEvent("info", "auth_destination_resolved", {
    destination: resolution.destination,
    status: resolution.status,
  })

  return resolution
}

import type { PostAuthResolution, UserProfile, WorkspaceSummary } from "../types/auth.types"
import { sanitizeReturnPath, isSafeInternalPath } from "./safe-return-path"
import { isOnboardingCompleted } from "./profile-bootstrap"

export interface PostAuthContext {
  userId: string | null
  profile: UserProfile | null
  workspaces: WorkspaceSummary[]
  requestedReturnTo?: string | null
}

/**
 * Pure domain resolver for candidate post-auth routing.
 * Evaluates identity, onboarding completion, workspace membership, and return path.
 */
export function resolvePostAuthDestination(context: PostAuthContext): PostAuthResolution {
  const { userId, profile, workspaces, requestedReturnTo } = context

  // 1. Session check
  if (!userId) {
    return {
      status: "UNAUTHENTICATED",
      destination: "/login",
    }
  }

  // 2. Profile existence check
  if (!profile) {
    return {
      status: "ONBOARDING_REQUIRED",
      step: "profile",
      destination: "/onboarding/profile",
    }
  }

  // 3. Onboarding completion check
  if (!isOnboardingCompleted(profile)) {
    const step = profile.onboardingState === "not_started" ? "profile" : profile.onboardingState
    return {
      status: "ONBOARDING_REQUIRED",
      step: profile.onboardingState,
      destination: `/onboarding/${step}`,
    }
  }

  // 4. Active workspace membership check
  const activeWorkspaces = workspaces.filter((w) => w.status === "active")
  if (activeWorkspaces.length === 0) {
    return {
      status: "WORKSPACE_REQUIRED",
      destination: "/onboarding/workspace",
    }
  }

  // 5. Resolve target workspace (last active if still accessible, otherwise first available)
  let targetWorkspace = activeWorkspaces.find((w) => w.id === profile.lastActiveWorkspaceId)
  if (!targetWorkspace) {
    targetWorkspace = activeWorkspaces[0]
  }

  // 6. Safe return path evaluation
  if (requestedReturnTo && isSafeInternalPath(requestedReturnTo)) {
    const sanitized = sanitizeReturnPath(requestedReturnTo, `/w/${targetWorkspace.slug}/today`)
    // If the path targets a workspace, ensure it's either an authorized workspace or relative
    if (sanitized.startsWith("/w/")) {
      const match = /^\/w\/([^/]+)/.exec(sanitized)
      const requestedSlug = match?.[1]
      const isAuthorizedSlug = activeWorkspaces.some((w) => w.slug === requestedSlug)
      if (isAuthorizedSlug) {
        return {
          status: "AUTHORIZED",
          workspaceSlug: requestedSlug!,
          destination: sanitized,
        }
      }
    } else {
      // General app paths like /settings, /profile
      return {
        status: "AUTHORIZED",
        workspaceSlug: targetWorkspace.slug,
        destination: sanitized,
      }
    }
  }

  return {
    status: "AUTHORIZED",
    workspaceSlug: targetWorkspace.slug,
    destination: `/w/${targetWorkspace.slug}/today`,
  }
}

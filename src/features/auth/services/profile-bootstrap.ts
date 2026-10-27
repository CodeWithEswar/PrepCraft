import type { UserProfile, OnboardingStep } from "../types/auth.types"

export interface RawAuthUserData {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

export interface ProfileBootstrapPayload {
  id: string
  displayName: string
  avatarUrl: string | null
  timezone: string
  onboardingState: OnboardingStep
}

/**
 * Extracts normalized profile defaults from raw OAuth user data.
 * Does not perform database operations directly — pure domain helper.
 */
export function buildProfileBootstrapPayload(user: RawAuthUserData): ProfileBootstrapPayload {
  const metadata = user.user_metadata || {}

  const rawName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    (user.email ? user.email.split("@")[0] : "Candidate")

  const displayName = rawName.slice(0, 60)

  const avatarUrl =
    typeof metadata.avatar_url === "string" && metadata.avatar_url.startsWith("https://")
      ? metadata.avatar_url
      : null

  return {
    id: user.id,
    displayName,
    avatarUrl,
    timezone: "UTC",
    onboardingState: "not_started",
  }
}

/**
 * Validates whether a profile's onboarding state is marked completed.
 */
export function isOnboardingCompleted(profile: Pick<UserProfile, "onboardingState" | "onboardingCompletedAt">): boolean {
  return profile.onboardingState === "completed" || profile.onboardingCompletedAt !== null
}

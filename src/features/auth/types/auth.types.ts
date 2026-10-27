/**
 * PrepCraft Authentication & Identity Types
 * Strictly defines authentication state machine, error taxonomy,
 * user profile, and post-auth resolution types.
 */

export type AuthState =
  | "SIGNED_OUT"
  | "OAUTH_STARTING"
  | "OAUTH_CALLBACK_PENDING"
  | "AUTHENTICATED_PROFILE_RESOLVING"
  | "AUTHENTICATED_ONBOARDING_REQUIRED"
  | "AUTHENTICATED_WORKSPACE_REQUIRED"
  | "AUTHENTICATED_READY"
  | "SESSION_EXPIRED"
  | "ACCESS_REVOKED"
  | "AUTH_ERROR"

export type AuthErrorReason =
  | "OAUTH_CANCELLED"
  | "OAUTH_PROVIDER_ERROR"
  | "CALLBACK_INVALID"
  | "SESSION_EXCHANGE_FAILED"
  | "PROFILE_RESOLUTION_FAILED"
  | "WORKSPACE_RESOLUTION_FAILED"
  | "ACCESS_REVOKED"
  | "NETWORK_ERROR"
  | "UNEXPECTED_AUTH_ERROR"

export type OnboardingStep =
  | "not_started"
  | "profile"
  | "career_target"
  | "coding_language"
  | "study_commitment"
  | "target_date"
  | "workspace"
  | "completed"

export interface UserProfile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  graduationYear: number | null
  collegeName: string | null
  preferredCodingLanguage: "java" | "python" | "cpp" | "javascript" | "other" | null
  timezone: string
  onboardingState: OnboardingStep
  onboardingCompletedAt: string | null
  lastActiveWorkspaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkspaceSummary {
  id: string
  slug: string
  name: string
  role: "owner" | "admin" | "member"
  status: "active" | "invited" | "revoked"
}

export type PostAuthResolution =
  | { status: "UNAUTHENTICATED"; destination: string }
  | { status: "ONBOARDING_REQUIRED"; step: OnboardingStep; destination: string }
  | { status: "WORKSPACE_REQUIRED"; destination: string }
  | { status: "AUTHORIZED"; workspaceSlug: string; destination: string }

export interface LastUsedAccountHint {
  email: string
  maskedEmail: string
  displayName?: string
  avatarUrl?: string
  lastUsedAt: string
}

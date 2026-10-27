import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { UserProfile, WorkspaceSummary, OnboardingStep } from "../types/auth.types"
import { buildProfileBootstrapPayload, type RawAuthUserData } from "../services/profile-bootstrap"
import { logEvent } from "@/lib/observability/logger.server"

/**
 * Fetches the user profile from Supabase PostgreSQL.
 * Governed by PostgreSQL RLS.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    logEvent("error", "auth_fetch_profile_failed", { code: "unexpected" })
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    graduationYear: data.graduation_year,
    collegeName: data.college_name,
    preferredCodingLanguage: data.preferred_coding_language as UserProfile["preferredCodingLanguage"],
    timezone: data.timezone,
    onboardingState: data.onboarding_state as OnboardingStep,
    onboardingCompletedAt: data.onboarding_completed_at,
    lastActiveWorkspaceId: data.last_active_workspace_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Idempotently ensures a profile row exists in PostgreSQL for the authenticated user.
 * If missing, bootstraps the row with safe defaults from OAuth metadata.
 */
export async function ensureUserProfile(user: RawAuthUserData): Promise<UserProfile | null> {
  const existing = await getUserProfile(user.id)
  if (existing) {
    return existing
  }

  const payload = buildProfileBootstrapPayload(user)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: payload.id,
      display_name: payload.displayName,
      avatar_url: payload.avatarUrl,
      timezone: payload.timezone,
      onboarding_state: payload.onboardingState,
    })
    .select("*")
    .single()

  if (error) {
    // If conflict occurred concurrently, attempt one final read
    if (error.code === "23505") {
      return getUserProfile(user.id)
    }
    logEvent("error", "auth_profile_bootstrap_failed", { code: "unexpected" })
    return null
  }

  logEvent("info", "auth_profile_bootstrapped", {})

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    graduationYear: data.graduation_year,
    collegeName: data.college_name,
    preferredCodingLanguage: data.preferred_coding_language as UserProfile["preferredCodingLanguage"],
    timezone: data.timezone,
    onboardingState: data.onboarding_state as OnboardingStep,
    onboardingCompletedAt: data.onboarding_completed_at,
    lastActiveWorkspaceId: data.last_active_workspace_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Queries workspaces in which the authenticated user holds membership.
 */
export async function getUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      status,
      workspaces (
        id,
        slug,
        name
      )
    `)
    .eq("user_id", userId)

  if (error || !data) {
    logEvent("error", "auth_fetch_workspaces_failed", { code: "unexpected" })
    return []
  }

  const summaries: WorkspaceSummary[] = []
  for (const item of data) {
    const ws = item.workspaces as { id: string; slug: string; name: string } | null
    if (ws && item.status) {
      summaries.push({
        id: ws.id,
        slug: ws.slug,
        name: ws.name,
        role: item.role as WorkspaceSummary["role"],
        status: item.status as WorkspaceSummary["status"],
      })
    }
  }

  return summaries
}

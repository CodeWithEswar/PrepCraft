"use server"
import "server-only"
import { createClient } from "@/lib/supabase/server"
import {
  profileStepSchema,
  targetStepSchema,
  languageStepSchema,
  commitmentStepSchema,
  targetDateStepSchema,
  workspaceStepSchema,
  type ProfileStepValues,
  type TargetStepValues,
  type LanguageStepValues,
  type CommitmentStepValues,
  type TargetDateStepValues,
  type WorkspaceStepValues,
} from "../schemas"
import { bootstrapWorkspace } from "./workspace-bootstrap"
import type { RoleFamily, StudyDay, CodingLanguage, MutationResult } from "../types/onboarding.types"

function isIgnorableDraftError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false
  const msg = error.message?.toLowerCase() || ""
  return (
    msg.includes("could not find the table") ||
    msg.includes("schema cache") ||
    msg.includes("relation") ||
    error.code === "PGRST204" ||
    error.code === "42P01"
  )
}

export async function saveWelcomeStepAction(): Promise<MutationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Authentication required to continue onboarding." }
  }

  // Advance state to profile
  await supabase
    .from("profiles")
    .update({ onboarding_state: "profile", updated_at: new Date().toISOString() })
    .eq("id", user.id)

  return { success: true, nextUrl: "/onboarding/profile" }
}

export async function saveProfileStepAction(rawValues: ProfileStepValues): Promise<MutationResult> {
  const parsed = profileStepSchema.safeParse(rawValues)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
    })
    return { success: false, error: "Please fix the profile validation errors.", fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  const { displayName, collegeName, graduationYear } = parsed.data

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      college_name: collegeName || null,
      graduation_year: graduationYear,
      onboarding_state: "career_target",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return { success: false, error: `Failed to save profile: ${error.message}` }
  }

  return { success: true, nextUrl: "/onboarding/target" }
}

export async function saveTargetStepAction(rawValues: TargetStepValues): Promise<MutationResult> {
  const parsed = targetStepSchema.safeParse(rawValues)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
    })
    return { success: false, error: "Please fix target selection errors.", fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  const { roleFamily, roleName, companySelection, customCompanyName } = parsed.data

  const targetCompanyName =
    companySelection === "other"
      ? customCompanyName || "Other"
      : companySelection !== "none"
        ? companySelection
        : null

  // Upsert draft state in PostgreSQL
  const { error: draftError } = await supabase.from("onboarding_drafts").upsert(
    {
      user_id: user.id,
      target_role_family: roleFamily,
      target_role_name: roleName,
      target_company_id: companySelection !== "none" && companySelection !== "other" ? companySelection : null,
      target_company_name: targetCompanyName,
      custom_company_name: companySelection === "other" ? customCompanyName || null : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (draftError && !isIgnorableDraftError(draftError)) {
    return { success: false, error: `Failed to save target selection: ${draftError.message}` }
  }

  // Advance onboarding state
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_state: "coding_language", updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (profileError) {
    return { success: false, error: `Failed to advance onboarding: ${profileError.message}` }
  }

  return { success: true, nextUrl: "/onboarding/language" }
}

export async function saveLanguageStepAction(rawValues: LanguageStepValues): Promise<MutationResult> {
  const parsed = languageStepSchema.safeParse(rawValues)
  if (!parsed.success) {
    return { success: false, error: "Please choose your interview coding language." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  const { preferredCodingLanguage } = parsed.data

  // Save to profile and draft
  await supabase
    .from("profiles")
    .update({
      preferred_coding_language: preferredCodingLanguage,
      onboarding_state: "study_commitment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  await supabase.from("onboarding_drafts").upsert(
    {
      user_id: user.id,
      preferred_coding_language: preferredCodingLanguage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  return { success: true, nextUrl: "/onboarding/commitment" }
}

export async function saveCommitmentStepAction(
  rawValues: CommitmentStepValues
): Promise<MutationResult> {
  const parsed = commitmentStepSchema.safeParse(rawValues)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
    })
    return { success: false, error: "Please verify study commitment settings.", fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  const { weeklyTargetMinutes, studyDays, defaultDailyMinutes } = parsed.data

  const { error } = await supabase.from("onboarding_drafts").upsert(
    {
      user_id: user.id,
      weekly_target_minutes: weeklyTargetMinutes,
      study_days: studyDays,
      default_daily_minutes: defaultDailyMinutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error && !isIgnorableDraftError(error)) {
    return { success: false, error: `Failed to save commitment schedule: ${error.message}` }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_state: "target_date", updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (profileError) {
    return { success: false, error: `Failed to advance onboarding: ${profileError.message}` }
  }

  return { success: true, nextUrl: "/onboarding/target-date" }
}

export async function saveTargetDateStepAction(
  rawValues: TargetDateStepValues
): Promise<MutationResult> {
  const parsed = targetDateStepSchema.safeParse(rawValues)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
    })
    return { success: false, error: "Please select a valid future target date.", fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  const { hasTargetDate, targetDate } = parsed.data

  const { error } = await supabase.from("onboarding_drafts").upsert(
    {
      user_id: user.id,
      has_target_date: hasTargetDate,
      target_date: hasTargetDate && targetDate ? targetDate : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error && !isIgnorableDraftError(error)) {
    return { success: false, error: `Failed to save target date: ${error.message}` }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_state: "workspace", updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (profileError) {
    return { success: false, error: `Failed to advance onboarding: ${profileError.message}` }
  }

  return { success: true, nextUrl: "/onboarding/workspace" }
}

export async function createInitialWorkspaceAction(
  rawValues: WorkspaceStepValues
): Promise<MutationResult<{ workspaceSlug: string }>> {
  const parsed = workspaceStepSchema.safeParse(rawValues)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
    })
    return { success: false, error: "Please provide a valid workspace name and template.", fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  // Load draft data
  const { data: draft } = await supabase
    .from("onboarding_drafts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const { workspaceName, templateId } = parsed.data

  const roleFamily = (draft?.target_role_family as RoleFamily) || "Software Engineer"
  const roleName = draft?.target_role_name || "Software Engineer"
  const codingLanguage =
    (draft?.preferred_coding_language as CodingLanguage) ||
    (profile?.preferred_coding_language as CodingLanguage) ||
    "java"
  const weeklyTargetMinutes = draft?.weekly_target_minutes || 600
  const studyDays = (draft?.study_days || [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]) as StudyDay[]
  const defaultDailyMinutes = draft?.default_daily_minutes || 120
  const targetDate = draft?.has_target_date ? draft.target_date : null

  try {
    const result = await bootstrapWorkspace({
      userId: user.id,
      displayName: profile?.display_name || undefined,
      workspaceName,
      roleFamily,
      roleName,
      companyId: draft?.target_company_id || null,
      companyName: draft?.target_company_name || null,
      customCompanyName: draft?.custom_company_name || null,
      preferredCodingLanguage: codingLanguage,
      weeklyTargetMinutes,
      studyDays,
      defaultDailyMinutes,
      targetDate,
      templateId,
    })

    return {
      success: true,
      data: { workspaceSlug: result.workspaceSlug },
      nextUrl: `/onboarding/ready?workspace=${result.workspaceSlug}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to bootstrap workspace"
    return { success: false, error: message }
  }
}

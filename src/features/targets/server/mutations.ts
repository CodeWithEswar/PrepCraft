import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { verifyWorkspaceAccess } from "@/features/workspaces/server"
import {
  updateTargetSchema,
  updatePreferencesSchema,
  type UpdateTargetValues,
  type UpdatePreferencesValues,
} from "../schemas/target.schema"

export type TargetMutationResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Updates a workspace's preparation target parameters.
 * Emits workspace.target_updated event and preserves historical attempts.
 */
export async function updateTargetAction(
  values: UpdateTargetValues
): Promise<TargetMutationResult> {
  const parsed = updateTargetSchema.safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const field = err.path.join(".")
      if (field) fieldErrors[field] = err.message
    })
    return { success: false, error: "Please resolve the target errors.", fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Unauthenticated." }
  }

  const access = await verifyWorkspaceAccess(parsed.data.workspaceId, user.id, "owner")
  if (!access.isOwner) {
    return { success: false, error: access.error || "Permission denied: only workspace owners can update targets." }
  }

  const data = parsed.data
  const { error: updateError } = await supabase
    .from("workspace_targets")
    .upsert({
      workspace_id: data.workspaceId,
      company_id: data.companyId || null,
      company_name: data.companyName || null,
      custom_company_name: data.customCompanyName || null,
      role_family: data.roleFamily,
      role_name: data.roleName,
      custom_role_name: data.customRoleName || null,
      preparation_level: data.preparationLevel,
      interview_language: data.interviewLanguage,
      target_date: data.targetDate || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" })

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Record audit activity event
  await supabase.from("workspace_activity_events").insert({
    workspace_id: data.workspaceId,
    user_id: user.id,
    event_type: "workspace.target_updated",
    payload: {
      company: data.companyName || data.customCompanyName,
      role: data.roleName,
      target_date: data.targetDate,
      preparation_level: data.preparationLevel,
      interview_language: data.interviewLanguage,
    },
  })

  // Revalidate workspace routes
  revalidatePath("/settings/workspaces")

  return { success: true }
}

/**
 * Updates a workspace's scheduling and study commitment preferences.
 * Emits workspace.commitment_updated event and preserves historical progress.
 */
export async function updatePreferencesAction(
  values: UpdatePreferencesValues
): Promise<TargetMutationResult> {
  const parsed = updatePreferencesSchema.safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const field = err.path.join(".")
      if (field) fieldErrors[field] = err.message
    })
    return { success: false, error: "Please resolve the schedule errors.", fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Unauthenticated." }
  }

  const access = await verifyWorkspaceAccess(parsed.data.workspaceId, user.id, "owner")
  if (!access.isOwner) {
    return { success: false, error: access.error || "Permission denied: only workspace owners can update schedules." }
  }

  const data = parsed.data

  // 1. Update workspace_preferences
  const { error: prefError } = await supabase
    .from("workspace_preferences")
    .upsert({
      workspace_id: data.workspaceId,
      weekly_target_minutes: data.weeklyTargetMinutes,
      default_daily_minutes: data.defaultDailyMinutes,
      study_days: data.studyDays,
      planning_mode: data.planningMode,
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" })

  if (prefError) {
    return { success: false, error: prefError.message }
  }

  // 2. Sync to legacy workspace_settings
  await supabase
    .from("workspace_settings")
    .upsert({
      workspace_id: data.workspaceId,
      weekly_target_minutes: data.weeklyTargetMinutes,
      default_daily_minutes: data.defaultDailyMinutes,
      study_days: data.studyDays,
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" })

  // 3. Emit activity event
  await supabase.from("workspace_activity_events").insert({
    workspace_id: data.workspaceId,
    user_id: user.id,
    event_type: "workspace.commitment_updated",
    payload: {
      weekly_minutes: data.weeklyTargetMinutes,
      daily_minutes: data.defaultDailyMinutes,
      study_days: data.studyDays,
      planning_mode: data.planningMode,
    },
  })

  revalidatePath("/settings/workspaces")
  return { success: true }
}

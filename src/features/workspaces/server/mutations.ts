"use server"
import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { MutationResult } from "../types/workspace.types"
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
  archiveWorkspaceSchema,
  restoreWorkspaceSchema,
  type CreateWorkspaceValues,
  type RenameWorkspaceValues,
  type ArchiveWorkspaceValues,
  type RestoreWorkspaceValues,
} from "../schemas/workspace.schema"
import { slugifyWorkspaceName } from "../utils/workspace-slug"
import { verifyWorkspaceAccess } from "./permissions"

/**
 * Creates a new workspace for an authenticated candidate.
 */
export async function createWorkspaceAction(
  values: CreateWorkspaceValues
): Promise<MutationResult<{ workspaceId: string; slug: string }>> {
  const parsed = createWorkspaceSchema.safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const field = err.path.join(".")
      if (field) fieldErrors[field] = err.message
    })
    return { success: false, error: "Please resolve the form errors.", fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "You must be signed in to create a workspace." }
  }

  const data = parsed.data
  const slug = slugifyWorkspaceName(data.name)

  // Ensure unique slug
  let counter = 1
  let finalSlug = slug
  while (true) {
    const { data: existing } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle()

    if (!existing) break
    counter++
    finalSlug = `${slug}-${counter}`
  }

  // 1. Create workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name: data.name,
      slug: finalSlug,
      created_by: user.id,
      created_by_user_id: user.id,
      status: "active",
      timezone: data.timezone || "UTC",
    })
    .select("id, slug")
    .single()

  if (wsError || !workspace) {
    return { success: false, error: wsError?.message || "Failed to create workspace." }
  }

  // 2. Add owner membership
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  })

  if (memberError) {
    return { success: false, error: memberError.message }
  }

  // 3. Create target
  await supabase.from("workspace_targets").insert({
    workspace_id: workspace.id,
    role_family: data.roleFamily,
    role_name: data.roleName,
    company_id: data.companyId || null,
    company_name: data.companyName || null,
    custom_company_name: data.customCompanyName || null,
    target_date: data.targetDate || null,
    preparation_level: data.preparationLevel,
    interview_language: data.interviewLanguage,
    template_id: data.templateId,
    template_version: 1,
  })

  // 4. Create preferences
  await supabase.from("workspace_preferences").insert({
    workspace_id: workspace.id,
    weekly_target_minutes: data.weeklyTargetMinutes,
    default_daily_minutes: data.defaultDailyMinutes,
    study_days: data.studyDays,
    planning_mode: "balanced",
  })

  // Also maintain backward-compatible workspace_settings
  await supabase.from("workspace_settings").insert({
    workspace_id: workspace.id,
    weekly_target_minutes: data.weeklyTargetMinutes,
    default_daily_minutes: data.defaultDailyMinutes,
    study_days: data.studyDays,
    preferred_coding_language: data.interviewLanguage,
  })

  // 5. Emit activity event
  await supabase.from("workspace_activity_events").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    event_type: "workspace.created",
    payload: { name: data.name, slug: workspace.slug },
  })

  // 6. Update last active workspace in profile
  await supabase
    .from("profiles")
    .update({ last_active_workspace_id: workspace.id })
    .eq("id", user.id)

  revalidatePath("/settings/workspaces")
  revalidatePath(`/w/${workspace.slug}`)

  return {
    success: true,
    data: { workspaceId: workspace.id, slug: workspace.slug },
    nextUrl: `/w/${workspace.slug}/today`,
  }
}

/**
 * Renames a workspace and updates its timezone.
 */
export async function renameWorkspaceAction(
  values: RenameWorkspaceValues
): Promise<MutationResult> {
  const parsed = renameWorkspaceSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Invalid workspace details." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthenticated." }

  const auth = await verifyWorkspaceAccess(parsed.data.workspaceId, user.id, "owner")
  if (!auth.isOwner) {
    return { success: false, error: auth.error || "Permission denied." }
  }

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.workspaceId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  await supabase.from("workspace_activity_events").insert({
    workspace_id: parsed.data.workspaceId,
    user_id: user.id,
    event_type: "workspace.renamed",
    payload: { new_name: parsed.data.name },
  })

  revalidatePath("/settings/workspaces")
  return { success: true }
}

/**
 * Archives a workspace while preserving all historical data and progress.
 */
export async function archiveWorkspaceAction(
  values: ArchiveWorkspaceValues
): Promise<MutationResult> {
  const parsed = archiveWorkspaceSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Invalid archive request." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthenticated." }

  const auth = await verifyWorkspaceAccess(parsed.data.workspaceId, user.id, "owner")
  if (!auth.isOwner) {
    return { success: false, error: auth.error || "Permission denied: only owners can archive." }
  }

  // Call database procedure archive_workspace
  const { data: result, error: rpcError } = await supabase.rpc("archive_workspace", {
    p_workspace_id: parsed.data.workspaceId,
  })

  if (rpcError) {
    // Direct table fallback
    await supabase
      .from("workspaces")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.workspaceId)

    await supabase.from("workspace_activity_events").insert({
      workspace_id: parsed.data.workspaceId,
      user_id: user.id,
      event_type: "workspace.archived",
      payload: { archived_at: new Date().toISOString() },
    })
  } else if (result && typeof result === "object" && "success" in result && !result.success) {
    return { success: false, error: String((result as { error: string }).error) }
  }

  revalidatePath("/settings/workspaces")
  return { success: true }
}

/**
 * Restores an archived workspace back to active status.
 */
export async function restoreWorkspaceAction(
  values: RestoreWorkspaceValues
): Promise<MutationResult> {
  const parsed = restoreWorkspaceSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Invalid restore request." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthenticated." }

  const auth = await verifyWorkspaceAccess(parsed.data.workspaceId, user.id, "owner")
  if (!auth.isOwner) {
    return { success: false, error: auth.error || "Permission denied." }
  }

  const { data: result, error: rpcError } = await supabase.rpc("restore_workspace", {
    p_workspace_id: parsed.data.workspaceId,
  })

  if (rpcError) {
    // Direct table fallback
    await supabase
      .from("workspaces")
      .update({
        status: "active",
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.workspaceId)

    await supabase.from("workspace_activity_events").insert({
      workspace_id: parsed.data.workspaceId,
      user_id: user.id,
      event_type: "workspace.restored",
      payload: { restored_at: new Date().toISOString() },
    })
  } else if (result && typeof result === "object" && "success" in result && !result.success) {
    return { success: false, error: String((result as { error: string }).error) }
  }

  revalidatePath("/settings/workspaces")
  return { success: true }
}

/**
 * Safely updates the user's last active workspace in their profile.
 */
export async function switchWorkspaceAction(
  workspaceId: string
): Promise<MutationResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthenticated." }

  const auth = await verifyWorkspaceAccess(workspaceId, user.id, "member")
  if (!auth.isMember) {
    return { success: false, error: "You are not a member of this workspace." }
  }

  await supabase
    .from("profiles")
    .update({ last_active_workspace_id: workspaceId })
    .eq("id", user.id)

  return { success: true }
}

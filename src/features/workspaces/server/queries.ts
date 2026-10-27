import "server-only"
import { createClient } from "@/lib/supabase/server"
import type {
  Workspace,
  WorkspaceContext,
  WorkspaceListItem,
  WorkspaceMembership,
  WorkspacePreferences,
  WorkspaceTarget,
  WorkspaceActivityEvent,
} from "../types/workspace.types"
import { resolveWorkspacePermissions } from "../services/workspace-permissions"

/**
 * Server boundary resolving a workspace by slug and verifying the authenticated user's active membership.
 * Never leaks private metadata if unauthorized.
 */
export async function resolveWorkspace(slug: string): Promise<WorkspaceContext | null> {
  const supabase = await createClient()

  // 1. Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  // 2. Fetch workspace by slug
  const { data: workspaceRow, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name, slug, status, timezone, created_by_user_id, created_at, updated_at, archived_at")
    .eq("slug", slug)
    .maybeSingle()

  if (wsError || !workspaceRow) {
    return null
  }

  // 3. Verify active membership
  const { data: memberRow, error: memberError } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, status, joined_at, created_at, updated_at")
    .eq("workspace_id", workspaceRow.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (memberError || !memberRow) {
    return null
  }

  const workspace: Workspace = {
    id: workspaceRow.id,
    name: workspaceRow.name,
    slug: workspaceRow.slug,
    status: (workspaceRow.status as Workspace["status"]) || "active",
    timezone: workspaceRow.timezone || "UTC",
    createdByUserId: workspaceRow.created_by_user_id,
    createdAt: workspaceRow.created_at,
    updatedAt: workspaceRow.updated_at,
    archivedAt: workspaceRow.archived_at,
  }

  const membership: WorkspaceMembership = {
    id: memberRow.id,
    workspaceId: memberRow.workspace_id,
    userId: memberRow.user_id,
    role: memberRow.role as WorkspaceMembership["role"],
    status: memberRow.status as WorkspaceMembership["status"],
    joinedAt: memberRow.joined_at,
    createdAt: memberRow.created_at,
    updatedAt: memberRow.updated_at,
  }

  // 4. Fetch target
  const { data: targetRow } = await supabase
    .from("workspace_targets")
    .select("*")
    .eq("workspace_id", workspace.id)
    .maybeSingle()

  let target: WorkspaceTarget | null = null
  if (targetRow) {
    target = {
      id: targetRow.id,
      workspaceId: targetRow.workspace_id,
      roleFamily: targetRow.role_family,
      roleId: targetRow.role_id,
      roleName: targetRow.role_name,
      customRoleName: targetRow.custom_role_name,
      companyId: targetRow.company_id,
      companyName: targetRow.company_name,
      customCompanyName: targetRow.custom_company_name,
      targetDate: targetRow.target_date,
      preparationLevel: (targetRow.preparation_level as WorkspaceTarget["preparationLevel"]) || "developing",
      interviewLanguage: (targetRow.interview_language as WorkspaceTarget["interviewLanguage"]) || "java",
      templateId: targetRow.template_id,
      templateVersion: targetRow.template_version || 1,
      createdAt: targetRow.created_at,
      updatedAt: targetRow.updated_at,
    }
  }

  // 5. Fetch preferences (with fallback to workspace_settings)
  const { data: prefRow } = await supabase
    .from("workspace_preferences")
    .select("*")
    .eq("workspace_id", workspace.id)
    .maybeSingle()

  let preferences: WorkspacePreferences
  if (prefRow) {
    preferences = {
      workspaceId: prefRow.workspace_id,
      weeklyTargetMinutes: prefRow.weekly_target_minutes,
      defaultDailyMinutes: prefRow.default_daily_minutes,
      studyDays: prefRow.study_days,
      planningMode: (prefRow.planning_mode as WorkspacePreferences["planningMode"]) || "balanced",
      createdAt: prefRow.created_at,
      updatedAt: prefRow.updated_at,
    }
  } else {
    // Fallback query to workspace_settings
    const { data: legacySettings } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle()

    preferences = {
      workspaceId: workspace.id,
      weeklyTargetMinutes: legacySettings?.weekly_target_minutes || 600,
      defaultDailyMinutes: legacySettings?.default_daily_minutes || 120,
      studyDays: legacySettings?.study_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
      planningMode: "balanced",
      createdAt: legacySettings?.created_at || workspace.createdAt,
      updatedAt: legacySettings?.updated_at || workspace.updatedAt,
    }
  }

  // 6. Compute fine-grained permissions
  const permissions = resolveWorkspacePermissions(membership, workspace.status)

  return {
    workspace,
    membership,
    target,
    preferences,
    permissions,
  }
}

/**
 * Returns all active and archived workspaces for the current authenticated user.
 */
export async function getUserWorkspaces(): Promise<WorkspaceListItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      status,
      workspace:workspaces!inner(
        id,
        name,
        slug,
        status,
        updated_at,
        targets:workspace_targets(
          company_name,
          custom_company_name,
          role_name,
          target_date,
          preparation_level,
          interview_language
        ),
        preferences:workspace_preferences(
          weekly_target_minutes
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("status", { referencedTable: "workspaces", ascending: true })

  if (error || !members) return []

  return members.map((m) => {
    const ws = m.workspace as unknown as {
      id: string
      name: string
      slug: string
      status: string
      updated_at: string
      targets?: Array<{
        company_name: string | null
        custom_company_name: string | null
        role_name: string | null
        target_date: string | null
        preparation_level: string | null
        interview_language: string | null
      }>
      preferences?: Array<{
        weekly_target_minutes: number
      }>
    }

    const target = ws.targets?.[0]
    const prefs = ws.preferences?.[0]

    return {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      status: (ws.status as Workspace["status"]) || "active",
      targetCompany: target?.company_name || target?.custom_company_name || null,
      targetRole: target?.role_name || null,
      targetDate: target?.target_date || null,
      weeklyMinutes: prefs?.weekly_target_minutes || 600,
      preparationLevel: target?.preparation_level || null,
      interviewLanguage: target?.interview_language || null,
      role: m.role as WorkspaceMembership["role"],
      updatedAt: ws.updated_at,
    }
  })
}

/**
 * Fetches recent activity stream events for a workspace.
 */
export async function getWorkspaceActivityEvents(
  workspaceId: string,
  limit = 20
): Promise<WorkspaceActivityEvent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("workspace_activity_events")
    .select("id, workspace_id, user_id, event_type, payload, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((d) => ({
    id: d.id,
    workspaceId: d.workspace_id,
    userId: d.user_id,
    eventType: d.event_type,
    payload: (d.payload as Record<string, unknown>) || {},
    createdAt: d.created_at,
  }))
}

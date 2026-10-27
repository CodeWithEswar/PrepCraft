import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { CompanyItem, RoleItem, TargetDetails, ScheduleDetails } from "../types/target.types"

/**
 * Returns canonical companies for selection popovers and targets.
 */
export async function getCanonicalCompanies(): Promise<CompanyItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, tier, category, description, logo_url")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error || !data) return []

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    tier: c.tier,
    category: c.category,
    description: c.description,
    logoUrl: c.logo_url,
  }))
}

/**
 * Returns canonical roles for selection popovers and targets.
 */
export async function getCanonicalRoles(): Promise<RoleItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("roles")
    .select("id, role_family, name, description")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error || !data) return []

  return data.map((r) => ({
    id: r.id,
    roleFamily: r.role_family,
    name: r.name,
    description: r.description,
  }))
}

/**
 * Fetches target details and scheduling preferences for a workspace.
 */
export async function getTargetDetails(
  workspaceId: string
): Promise<{ target: TargetDetails | null; preferences: ScheduleDetails | null }> {
  const supabase = await createClient()

  const [targetRes, prefRes, settingsRes] = await Promise.all([
    supabase
      .from("workspace_targets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_preferences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ])

  let target: TargetDetails | null = null
  if (targetRes.data) {
    const t = targetRes.data
    target = {
      workspaceId: t.workspace_id,
      roleFamily: t.role_family,
      roleId: t.role_id,
      roleName: t.role_name,
      customRoleName: t.custom_role_name,
      companyId: t.company_id,
      companyName: t.company_name,
      customCompanyName: t.custom_company_name,
      targetDate: t.target_date,
      preparationLevel: (t.preparation_level as TargetDetails["preparationLevel"]) || "developing",
      interviewLanguage: (t.interview_language as TargetDetails["interviewLanguage"]) || "java",
      templateId: t.template_id,
      templateVersion: t.template_version || 1,
    }
  }

  let preferences: ScheduleDetails | null = null
  if (prefRes.data) {
    const p = prefRes.data
    preferences = {
      workspaceId: p.workspace_id,
      weeklyTargetMinutes: p.weekly_target_minutes,
      defaultDailyMinutes: p.default_daily_minutes,
      studyDays: p.study_days,
      planningMode: (p.planning_mode as ScheduleDetails["planningMode"]) || "balanced",
    }
  } else if (settingsRes.data) {
    const s = settingsRes.data
    preferences = {
      workspaceId: s.workspace_id,
      weeklyTargetMinutes: s.weekly_target_minutes,
      defaultDailyMinutes: s.default_daily_minutes,
      studyDays: s.study_days,
      planningMode: "balanced",
    }
  }

  return { target, preferences }
}

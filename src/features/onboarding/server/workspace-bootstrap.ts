import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"
import type { WorkspaceBootstrapInput, WorkspaceBootstrapResult } from "../types/onboarding.types"
import { slugifyWorkspaceName } from "../services/workspace-slug"
import { generateInitialPlan } from "../services/initial-plan-generator"

export async function bootstrapWorkspace(
  input: WorkspaceBootstrapInput
): Promise<WorkspaceBootstrapResult> {
  const supabase = await createClient()

  const {
    userId,
    workspaceName,
    roleFamily,
    roleName,
    companyId,
    companyName,
    customCompanyName,
    preferredCodingLanguage,
    weeklyTargetMinutes,
    studyDays,
    defaultDailyMinutes,
    targetDate,
    templateId,
  } = input

  const baseSlug = slugifyWorkspaceName(workspaceName)

  // Generate the deterministic initial starter plan
  const plan = generateInitialPlan({
    templateId,
    weeklyTargetMinutes,
    studyDays,
    defaultDailyMinutes,
    preferredCodingLanguage,
    targetDate,
  })

  // 1. Try atomic PostgreSQL RPC procedure first
  try {
    const { data, error } = await supabase.rpc("bootstrap_initial_workspace", {
      p_user_id: userId,
      p_workspace_name: workspaceName,
      p_workspace_slug: baseSlug,
      p_role_family: roleFamily,
      p_role_name: roleName,
      p_company_id: companyId || undefined,
      p_company_name: companyName || undefined,
      p_custom_company_name: customCompanyName || undefined,
      p_preferred_coding_language: preferredCodingLanguage,
      p_weekly_target_minutes: weeklyTargetMinutes,
      p_study_days: studyDays,
      p_default_daily_minutes: defaultDailyMinutes,
      p_target_date: targetDate || undefined,
      p_template_id: templateId,
      p_total_weekly_minutes: plan.totalWeeklyMinutes,
      p_planned_sessions: plan.plannedSessions,
      p_focus_areas: plan.focusAreas,
      p_first_week_plan: plan.firstWeekPlan as unknown as Json,
      p_starter_items: plan.starterItems as unknown as Json,
    })

    if (!error && data) {
      const parsed = data as { workspace_id: string; workspace_slug: string; idempotent: boolean }
      return {
        workspaceId: parsed.workspace_id,
        workspaceSlug: parsed.workspace_slug,
        idempotent: parsed.idempotent,
      }
    }
  } catch {
    throw new Error("Workspace setup could not be confirmed. Your draft is preserved; please retry.")
  }
  throw new Error("Workspace setup could not be confirmed. Your draft is preserved; please retry.")
}

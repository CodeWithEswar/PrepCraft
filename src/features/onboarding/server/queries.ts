import "server-only"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type {
  OnboardingDraft,
  OnboardingStage,
  PreparationTemplate,
} from "../types/onboarding.types"
import { CANONICAL_TEMPLATES } from "../services/template-recommendation"
import { canAccessStage, mapDbStateToStage } from "../services/onboarding-transition"

export interface OnboardingUserContext {
  userId: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  collegeName: string | null
  graduationYear: number | null
  preferredCodingLanguage: string | null
  onboardingState: string
  onboardingCompletedAt: string | null
  lastActiveWorkspaceId: string | null
  draft: OnboardingDraft | null
}

export async function getOnboardingState(): Promise<OnboardingUserContext | null> {
  await connection()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  // Load draft if present
  const { data: draftRow } = await supabase
    .from("onboarding_drafts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const draft: OnboardingDraft | null = draftRow
    ? {
        userId: draftRow.user_id,
        targetRoleFamily: draftRow.target_role_family as OnboardingDraft["targetRoleFamily"],
        targetRoleName: draftRow.target_role_name,
        targetCompanyId: draftRow.target_company_id,
        targetCompanyName: draftRow.target_company_name,
        customCompanyName: draftRow.custom_company_name,
        preferredCodingLanguage: draftRow.preferred_coding_language as OnboardingDraft["preferredCodingLanguage"],
        weeklyTargetMinutes: draftRow.weekly_target_minutes,
        studyDays: (draftRow.study_days || ["monday", "tuesday", "wednesday", "thursday", "friday"]) as OnboardingDraft["studyDays"],
        defaultDailyMinutes: draftRow.default_daily_minutes,
        hasTargetDate: Boolean(draftRow.has_target_date),
        targetDate: draftRow.target_date,
        workspaceName: draftRow.workspace_name,
        selectedTemplateId: draftRow.selected_template_id,
        createdAt: draftRow.created_at,
        updatedAt: draftRow.updated_at,
      }
    : null

  // Fallback defaults from user metadata if profile not yet populated
  const meta = user.user_metadata || {}
  const displayName = profile?.display_name || meta.full_name || meta.name || user.email?.split("@")[0] || null
  const avatarUrl = profile?.avatar_url || meta.avatar_url || null

  return {
    userId: user.id,
    email: user.email || "",
    displayName,
    avatarUrl,
    collegeName: profile?.college_name || null,
    graduationYear: profile?.graduation_year || null,
    preferredCodingLanguage: profile?.preferred_coding_language || draft?.preferredCodingLanguage || null,
    onboardingState: profile?.onboarding_state || "not_started",
    onboardingCompletedAt: profile?.onboarding_completed_at || null,
    lastActiveWorkspaceId: profile?.last_active_workspace_id || null,
    draft,
  }
}

export async function getAvailableTemplates(): Promise<PreparationTemplate[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("preparation_templates")
      .select("*")
      .eq("status", "active")

    if (!error && data && data.length > 0) {
      return data.map((d) => ({
        id: d.id,
        name: d.name,
        roleFamily: d.role_family,
        targetCompany: d.target_company,
        description: d.description,
        focusAreas: d.focus_areas,
        tracks: d.tracks as unknown as PreparationTemplate["tracks"],
        version: d.version,
        status: d.status as PreparationTemplate["status"],
        lastReviewedAt: d.last_reviewed_at,
      }))
    }
  } catch (err) {
    console.warn("Unable to query preparation_templates table, using canonical defaults:", err)
  }

  return CANONICAL_TEMPLATES
}

/**
 * Server guard for each onboarding step page.
 * Validates authentication, completed status, and deep-link access permissions.
 */
export async function requireOnboardingStage(stage: OnboardingStage): Promise<OnboardingUserContext> {
  await connection()
  const context = await getOnboardingState()

  if (!context) {
    redirect(`/login?returnTo=/onboarding/${stage}`)
  }

  // If user has already completed onboarding, redirect to their workspace
  if (context.onboardingState === "completed" && stage !== "ready") {
    const supabase = await createClient()

    // 1. Try finding workspace by lastActiveWorkspaceId
    if (context.lastActiveWorkspaceId) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("slug")
        .eq("id", context.lastActiveWorkspaceId)
        .maybeSingle()

      if (ws?.slug) {
        redirect(`/w/${ws.slug}/today`)
      }
    }

    // 2. Try finding any workspace user belongs to
    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspaces(slug)")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .limit(1)

    if (members && members.length > 0 && members[0].workspaces) {
      const ws = members[0].workspaces as unknown as { slug: string }
      if (ws?.slug) {
        redirect(`/w/${ws.slug}/today`)
      }
    }

    redirect("/onboarding/ready")
  }

  // Deep-link protection: verify user has unlocked this stage
  const hasAccess = canAccessStage(context.onboardingState, stage)
  if (!hasAccess) {
    const currentAccessibleStage = mapDbStateToStage(context.onboardingState)
    redirect(`/onboarding/${currentAccessibleStage}`)
  }

  return context
}

export interface ReadyWorkspaceData {
  workspace: {
    id: string
    name: string
    slug: string
  }
  roleName: string
  companyName: string | null
  targetDate: string | null
  preferredCodingLanguage: string
  weeklyTargetMinutes: number
  studyDays: string[]
  plan: {
    templateId: string
    totalWeeklyMinutes: number
    plannedSessions: number
    focusAreas: string[]
    firstWeekPlan: Array<{
      day: string
      title: string
      focusArea: string
      allocatedMinutes: number
      items: Array<{
        title: string
        durationMinutes: number
        type: string
      }>
    }>
    starterItems: Array<{
      title: string
      tag: string
      durationMinutes: number
      description: string
    }>
  }
}

export async function getReadyWorkspaceDetails(
  userId: string,
  preferredSlug?: string
): Promise<ReadyWorkspaceData | null> {
  const supabase = await createClient()

  // 1. Locate workspace
  let workspace: { id: string; name: string; slug: string } | null = null

  if (preferredSlug) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("slug", preferredSlug)
      .maybeSingle()
    if (ws) workspace = ws
  }

  if (!workspace) {
    // Find last active workspace for user
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_active_workspace_id")
      .eq("id", userId)
      .maybeSingle()

    if (profile?.last_active_workspace_id) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, slug")
        .eq("id", profile.last_active_workspace_id)
        .maybeSingle()
      if (ws) workspace = ws
    }
  }

  if (!workspace) {
    // Fallback: look up workspace via workspace_members
    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(id, name, slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)

    if (members && members.length > 0 && members[0].workspaces) {
      const ws = members[0].workspaces as unknown as { id: string; name: string; slug: string }
      if (ws?.id) workspace = ws
    }
  }

  if (!workspace) {
    return null
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    const { data: wsCheck } = await supabase
      .from("workspaces")
      .select("created_by")
      .eq("id", workspace.id)
      .maybeSingle()
    if (wsCheck?.created_by !== userId) {
      return null
    }
  }

  // 2. Fetch targets, settings, and plan
  const [targetRes, settingsRes, planRes] = await Promise.all([
    supabase.from("workspace_targets").select("*").eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("workspace_plans").select("*").eq("workspace_id", workspace.id).maybeSingle(),
  ])

  const target = targetRes.data
  const settings = settingsRes.data
  const planRow = planRes.data

  const roleName = target?.role_name || "Software Engineer"
  const companyName = target?.company_name || target?.custom_company_name || null
  const targetDate = target?.target_date || null
  const preferredCodingLanguage = settings?.preferred_coding_language || "java"
  const weeklyTargetMinutes = settings?.weekly_target_minutes || 600
  const studyDays = settings?.study_days || ["monday", "tuesday", "wednesday", "thursday", "friday"]

  // Use stored plan or fallback
  const planData = planRow
    ? {
        templateId: planRow.template_id || "general-swe",
        totalWeeklyMinutes: planRow.total_weekly_minutes || weeklyTargetMinutes,
        plannedSessions: planRow.planned_sessions || studyDays.length,
        focusAreas: planRow.focus_areas || ["DSA", "Core CS", "System Design"],
        firstWeekPlan: (planRow.first_week_plan as unknown as ReadyWorkspaceData["plan"]["firstWeekPlan"]) || [],
        starterItems: (planRow.starter_items as unknown as ReadyWorkspaceData["plan"]["starterItems"]) || [],
      }
    : {
        templateId: "general-swe",
        totalWeeklyMinutes: weeklyTargetMinutes,
        plannedSessions: studyDays.length,
        focusAreas: ["DSA Foundations", "Core CS", "Behavioral"],
        firstWeekPlan: [],
        starterItems: [],
      }

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    roleName,
    companyName,
    targetDate,
    preferredCodingLanguage,
    weeklyTargetMinutes,
    studyDays,
    plan: planData,
  }
}


import "server-only"
import { createClient } from "@/lib/supabase/server"
import type {
  PreparationTemplate,
  TemplateVersion,
  TemplateDetail,
  TemplateVersionTrack,
  TemplateVersionTopic,
  TemplateVersionPattern,
  TemplateInterviewStage,
  TemplateReadinessRequirement,
  TemplateRecommendation,
  EffectiveWorkspaceCurriculum,
  TemplateUpgradeAvailability,
  CurriculumDiff,
} from "../types/template.types"
import { rankTemplatesForTarget, type RecommendationTargetContext } from "../services/recommendation-service"
import { resolveEffectiveCurriculum, type WorkspaceOverrideRecord } from "../services/curriculum-resolver"
import { computeCurriculumDiff } from "../services/template-diff-service"

interface TrackJoinRow {
  id: string
  template_version_id: string
  track_id: string
  priority: string
  weight: number
  recommended_minutes_percent: number | null
  sort_order: number
  required: boolean
  notes: string | null
  tracks: { name: string } | null
}

interface TopicJoinRow {
  id: string
  template_version_id: string
  track_id: string
  topic_id: string
  priority: string
  weight: number
  recommended_question_count: number | null
  recommended_revision_depth: number | null
  sort_order: number
  required: boolean
  topics: { name: string } | null
}

interface PatternJoinRow {
  id: string
  template_version_id: string
  pattern_id: string
  priority: string
  recommended_attempts: number | null
  sort_order: number
  patterns: { name: string; track_id: string } | null
}

/**
 * Fetches all published preparation templates available to the catalog.
 */
export async function getPublishedTemplates(): Promise<PreparationTemplate[]> {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from("preparation_templates")
    .select(`
      id,
      slug,
      name,
      short_name,
      description,
      company_id,
      role_id,
      role_family,
      template_type,
      status,
      visibility,
      current_published_version_id,
      created_at,
      updated_at
    `)
    .eq("status", "published")
    .in("visibility", ["public", "internal"])
    .order("name", { ascending: true })

  if (error || !rows) {
    return []
  }

  // Hydrate version numbers and track/topic counts
  const templates: PreparationTemplate[] = []
  for (const row of rows) {
    let currentVersionNumber = 1
    let trackCount = 0
    let topicCount = 0

    if (row.current_published_version_id) {
      const { data: ver } = await supabase
        .from("preparation_template_versions")
        .select("version_number")
        .eq("id", row.current_published_version_id)
        .maybeSingle()
      if (ver) {
        currentVersionNumber = ver.version_number
      }

      const { count: trCount } = await supabase
        .from("template_version_tracks")
        .select("*", { count: "exact", head: true })
        .eq("template_version_id", row.current_published_version_id)
      trackCount = trCount || 0

      const { count: topCount } = await supabase
        .from("template_version_topics")
        .select("*", { count: "exact", head: true })
        .eq("template_version_id", row.current_published_version_id)
      topicCount = topCount || 0
    }

    templates.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortName: row.short_name,
      description: row.description,
      companyId: row.company_id,
      roleId: row.role_id,
      roleFamilyId: row.role_family,
      templateType: row.template_type as PreparationTemplate["templateType"],
      status: row.status as PreparationTemplate["status"],
      visibility: row.visibility as PreparationTemplate["visibility"],
      currentPublishedVersionId: row.current_published_version_id,
      currentVersionNumber,
      trackCount,
      topicCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }

  return templates
}

/**
 * Returns deterministic recommendations ranked for a specific workspace target.
 */
export async function getRecommendedTemplates(
  target: RecommendationTargetContext
): Promise<TemplateRecommendation[]> {
  const publishedTemplates = await getPublishedTemplates()
  const supabase = await createClient()

  const pairs: { template: PreparationTemplate; version: TemplateVersion }[] = []

  for (const template of publishedTemplates) {
    if (!template.currentPublishedVersionId) continue

    const { data: verRow } = await supabase
      .from("preparation_template_versions")
      .select("*")
      .eq("id", template.currentPublishedVersionId)
      .maybeSingle()

    if (verRow) {
      const version: TemplateVersion = {
        id: verRow.id,
        templateId: verRow.template_id,
        versionNumber: verRow.version_number,
        status: verRow.status as TemplateVersion["status"],
        changeSummary: verRow.change_summary,
        reviewedAt: verRow.reviewed_at,
        publishedAt: verRow.published_at,
        deprecatedAt: verRow.deprecated_at,
        createdAt: verRow.created_at,
        updatedAt: verRow.updated_at,
      }
      pairs.push({ template, version })
    }
  }

  return rankTemplatesForTarget(pairs, target)
}

/**
 * Fetches full hydrated detail of a template including tracks, topics, patterns, and stages.
 */
export async function getTemplateDetail(
  templateIdOrSlug: string,
  versionNumber?: number
): Promise<TemplateDetail | null> {
  const supabase = await createClient()

  // 1. Fetch template
  let query = supabase
    .from("preparation_templates")
    .select("*")

  if (templateIdOrSlug.includes("-") && !templateIdOrSlug.includes("tmpl-")) {
    query = query.or(`slug.eq.${templateIdOrSlug},id.eq.${templateIdOrSlug}`)
  } else {
    query = query.eq("id", templateIdOrSlug)
  }

  const { data: tmplRow, error: tmplError } = await query.maybeSingle()
  if (tmplError || !tmplRow) {
    return null
  }

  // 2. Fetch version (by versionNumber or current_published_version_id)
  let verQuery = supabase.from("preparation_template_versions").select("*").eq("template_id", tmplRow.id)
  if (versionNumber) {
    verQuery = verQuery.eq("version_number", versionNumber)
  } else if (tmplRow.current_published_version_id) {
    verQuery = verQuery.eq("id", tmplRow.current_published_version_id)
  } else {
    verQuery = verQuery.eq("status", "published").order("version_number", { ascending: false }).limit(1)
  }

  const { data: verRow, error: verError } = await verQuery.maybeSingle()
  if (verError || !verRow) {
    return null
  }

  const template: PreparationTemplate = {
    id: tmplRow.id,
    slug: tmplRow.slug,
    name: tmplRow.name,
    shortName: tmplRow.short_name,
    description: tmplRow.description,
    companyId: tmplRow.company_id,
    roleId: tmplRow.role_id,
    roleFamilyId: tmplRow.role_family,
    templateType: tmplRow.template_type as PreparationTemplate["templateType"],
    status: tmplRow.status as PreparationTemplate["status"],
    visibility: tmplRow.visibility as PreparationTemplate["visibility"],
    currentPublishedVersionId: tmplRow.current_published_version_id,
    currentVersionNumber: verRow.version_number,
    createdAt: tmplRow.created_at,
    updatedAt: tmplRow.updated_at,
  }

  const version: TemplateVersion = {
    id: verRow.id,
    templateId: verRow.template_id,
    versionNumber: verRow.version_number,
    status: verRow.status as TemplateVersion["status"],
    changeSummary: verRow.change_summary,
    reviewedAt: verRow.reviewed_at,
    publishedAt: verRow.published_at,
    deprecatedAt: verRow.deprecated_at,
    createdAt: verRow.created_at,
    updatedAt: verRow.updated_at,
  }

  // 3. Fetch tracks with canonical names
  const { data: trackRows } = await supabase
    .from("template_version_tracks")
    .select(`
      id,
      template_version_id,
      track_id,
      priority,
      weight,
      recommended_minutes_percent,
      sort_order,
      required,
      notes,
      tracks:track_id ( name )
    `)
    .eq("template_version_id", version.id)
    .order("sort_order", { ascending: true })

  const tracks: TemplateVersionTrack[] = ((trackRows || []) as unknown as TrackJoinRow[]).map((r) => ({
    id: r.id,
    templateVersionId: r.template_version_id,
    trackId: r.track_id,
    trackName: r.tracks?.name || r.track_id,
    priority: r.priority as TemplateVersionTrack["priority"],
    weight: r.weight,
    recommendedMinutesPercent: r.recommended_minutes_percent,
    sortOrder: r.sort_order,
    required: r.required,
    notes: r.notes,
  }))

  // 4. Fetch topics with canonical names
  const { data: topicRows } = await supabase
    .from("template_version_topics")
    .select(`
      id,
      template_version_id,
      track_id,
      topic_id,
      priority,
      weight,
      recommended_question_count,
      recommended_revision_depth,
      sort_order,
      required,
      topics:topic_id ( name )
    `)
    .eq("template_version_id", version.id)
    .order("sort_order", { ascending: true })

  const topics: TemplateVersionTopic[] = ((topicRows || []) as unknown as TopicJoinRow[]).map((r) => ({
    id: r.id,
    templateVersionId: r.template_version_id,
    trackId: r.track_id,
    topicId: r.topic_id,
    topicName: r.topics?.name || r.topic_id,
    priority: r.priority as TemplateVersionTopic["priority"],
    weight: r.weight,
    recommendedQuestionCount: r.recommended_question_count ?? 10,
    recommendedRevisionDepth: r.recommended_revision_depth ?? 2,
    sortOrder: r.sort_order,
    required: r.required,
  }))

  // 5. Fetch patterns with canonical names
  const { data: patternRows } = await supabase
    .from("template_version_patterns")
    .select(`
      id,
      template_version_id,
      pattern_id,
      priority,
      recommended_attempts,
      sort_order,
      patterns:pattern_id ( name, track_id )
    `)
    .eq("template_version_id", version.id)
    .order("sort_order", { ascending: true })

  const patterns: TemplateVersionPattern[] = ((patternRows || []) as unknown as PatternJoinRow[]).map((r) => ({
    id: r.id,
    templateVersionId: r.template_version_id,
    patternId: r.pattern_id,
    patternName: r.patterns?.name || r.pattern_id,
    trackId: r.patterns?.track_id || "track-dsa",
    priority: r.priority as TemplateVersionPattern["priority"],
    recommendedAttempts: r.recommended_attempts ?? 5,
    sortOrder: r.sort_order,
  }))

  // 6. Fetch interview stages
  const { data: stageRows } = await supabase
    .from("template_interview_stages")
    .select("*")
    .eq("template_version_id", version.id)
    .order("sort_order", { ascending: true })

  const stages: TemplateInterviewStage[] = (stageRows || []).map((r) => ({
    id: r.id,
    templateVersionId: r.template_version_id,
    name: r.name,
    stageType: r.stage_type as TemplateInterviewStage["stageType"],
    sortOrder: r.sort_order,
    optional: r.optional,
    description: r.description,
  }))

  // 7. Fetch readiness requirements
  const { data: readinessRows } = await supabase
    .from("template_readiness_requirements")
    .select("*")
    .eq("template_version_id", version.id)

  const readinessRequirements: TemplateReadinessRequirement[] = (readinessRows || []).map((r) => ({
    id: r.id,
    templateVersionId: r.template_version_id,
    dimension: r.dimension as TemplateReadinessRequirement["dimension"],
    minimumEvidence: r.minimum_evidence,
    weight: r.weight,
    required: r.required,
  }))

  return {
    template,
    version,
    tracks,
    topics,
    patterns,
    stages,
    readinessRequirements,
    totalTracksCount: tracks.length,
    totalTopicsCount: topics.length,
  }
}

/**
 * Resolves the effective workspace curriculum for a given workspace.
 * Pinned to the workspace's assigned template version with user overrides applied.
 */
export async function getWorkspaceCurriculum(
  workspaceId: string
): Promise<EffectiveWorkspaceCurriculum | null> {
  const supabase = await createClient()

  // 1. Fetch workspace curriculum record
  const { data: currRow, error: currError } = await supabase
    .from("workspace_curricula")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  if (currError || !currRow) {
    // If no explicit curriculum row, check workspace_targets for fallback
    const { data: targetRow } = await supabase
      .from("workspace_targets")
      .select("template_id, template_version, interview_language")
      .eq("workspace_id", workspaceId)
      .maybeSingle()

    if (!targetRow || !targetRow.template_id) {
      return null
    }

    const detail = await getTemplateDetail(targetRow.template_id, targetRow.template_version || 1)
    if (!detail) return null

    return resolveEffectiveCurriculum({
      workspaceId,
      template: detail.template,
      version: detail.version,
      tracks: detail.tracks,
      topics: detail.topics,
      patterns: detail.patterns,
      stages: detail.stages,
      readinessRequirements: detail.readinessRequirements,
      interviewLanguage: targetRow.interview_language,
    })
  }

  // 2. Fetch full detail for pinned version
  const detail = await getTemplateDetail(currRow.template_id, currRow.version_number)
  if (!detail) {
    return null
  }

  // 3. Fetch overrides
  const { data: overrideRows } = await supabase
    .from("workspace_curriculum_overrides")
    .select("*")
    .eq("workspace_id", workspaceId)

  // 4. Fetch interview language from target
  const { data: targetRow } = await supabase
    .from("workspace_targets")
    .select("interview_language")
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  return resolveEffectiveCurriculum({
    workspaceId,
    template: detail.template,
    version: detail.version,
    tracks: detail.tracks,
    topics: detail.topics,
    patterns: detail.patterns,
    stages: detail.stages,
    readinessRequirements: detail.readinessRequirements,
    overrides: ((overrideRows || []) as unknown as WorkspaceOverrideRecord[]),
    interviewLanguage: targetRow?.interview_language,
  })
}

/**
 * Checks if a newer published version of the workspace's pinned template is available.
 */
export async function getAvailableTemplateUpgrade(
  workspaceId: string
): Promise<TemplateUpgradeAvailability | null> {
  const supabase = await createClient()

  // 1. Check workspace target or curriculum
  const { data: targetRow } = await supabase
    .from("workspace_targets")
    .select("template_id, template_version")
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  if (!targetRow || !targetRow.template_id) {
    return null
  }

  const currentVersionNum = targetRow.template_version || 1

  // 2. Fetch template latest published version
  const { data: tmplRow } = await supabase
    .from("preparation_templates")
    .select("current_published_version_id")
    .eq("id", targetRow.template_id)
    .maybeSingle()

  if (!tmplRow || !tmplRow.current_published_version_id) {
    return null
  }

  const { data: latestVer } = await supabase
    .from("preparation_template_versions")
    .select("id, version_number, change_summary")
    .eq("id", tmplRow.current_published_version_id)
    .maybeSingle()

  if (!latestVer) {
    return null
  }

  const hasUpgrade = latestVer.version_number > currentVersionNum

  return {
    available: hasUpgrade,
    currentVersionNumber: currentVersionNum,
    latestVersionNumber: latestVer.version_number,
    latestVersionId: latestVer.id,
    changeSummary: latestVer.change_summary,
  }
}

/**
 * Computes structural diff between current and candidate template versions.
 */
export async function getTemplateVersionDiff(
  templateId: string,
  currentVersionNum: number,
  candidateVersionNum: number
): Promise<CurriculumDiff | null> {
  const [currentDetail, candidateDetail] = await Promise.all([
    getTemplateDetail(templateId, currentVersionNum),
    getTemplateDetail(templateId, candidateVersionNum),
  ])

  if (!currentDetail || !candidateDetail) {
    return null
  }

  return computeCurriculumDiff(
    {
      versionNumber: currentDetail.version.versionNumber,
      tracks: currentDetail.tracks,
      topics: currentDetail.topics,
      patterns: currentDetail.patterns,
    },
    {
      versionNumber: candidateDetail.version.versionNumber,
      tracks: candidateDetail.tracks,
      topics: candidateDetail.topics,
      patterns: candidateDetail.patterns,
    }
  )
}

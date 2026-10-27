/**
 * PrepCraft Curriculum Resolver Service
 * 
 * Rules:
 * - Templates define recommendations.
 * - Workspaces own effective preparation.
 * - Effective curriculum is resolved deterministically from:
 *   Base Template Version + Target Language + Workspace Overrides
 * - Computes normalized planning allocation weights.
 */

import type {
  PreparationTemplate,
  TemplateVersion,
  TemplateVersionTrack,
  TemplateVersionTopic,
  TemplateVersionPattern,
  TemplateInterviewStage,
  TemplateReadinessRequirement,
  EffectiveWorkspaceCurriculum,
  EffectiveCurriculumTrack,
  EffectiveCurriculumTopic,
  EffectiveCurriculumPattern,
  PlanningAllocationSlice,
  CurriculumPriority,
} from "../types/template.types"

export interface WorkspaceOverrideRecord {
  entityType: 'track' | 'topic' | 'pattern'
  entityId: string
  overrideType: 'priority' | 'weight' | 'inclusion'
  value: Record<string, unknown>
}

export interface ResolveCurriculumParams {
  workspaceId: string
  template: PreparationTemplate
  version: TemplateVersion
  tracks: TemplateVersionTrack[]
  topics: TemplateVersionTopic[]
  patterns: TemplateVersionPattern[]
  stages: TemplateInterviewStage[]
  readinessRequirements: TemplateReadinessRequirement[]
  overrides?: WorkspaceOverrideRecord[]
  interviewLanguage?: string | null
}

export function resolveEffectiveCurriculum(
  params: ResolveCurriculumParams
): EffectiveWorkspaceCurriculum {
  const {
    workspaceId,
    template,
    version,
    tracks,
    topics,
    patterns,
    stages,
    readinessRequirements,
    overrides = [],
    interviewLanguage,
  } = params

  // 1. Index overrides for fast lookup
  const overrideMap = new Map<string, WorkspaceOverrideRecord>()
  for (const ov of overrides) {
    const key = `${ov.entityType}:${ov.entityId}:${ov.overrideType}`
    overrideMap.set(key, ov)
  }

  // 2. Build Effective Tracks
  const effectiveTracks: EffectiveCurriculumTrack[] = []
  let totalWeight = 0

  for (const track of tracks) {
    // Check inclusion override
    const incOv = overrideMap.get(`track:${track.trackId}:inclusion`)
    if (incOv && incOv.value.included === false) {
      continue // user excluded this track
    }

    // Check priority override
    let priority: CurriculumPriority = track.priority
    const prioOv = overrideMap.get(`track:${track.trackId}:priority`)
    if (prioOv && typeof prioOv.value.priority === 'string') {
      priority = prioOv.value.priority as CurriculumPriority
    }

    // Check weight override
    let weight = track.weight
    const weightOv = overrideMap.get(`track:${track.trackId}:weight`)
    if (weightOv && typeof weightOv.value.weight === 'number') {
      weight = Math.max(0, Math.min(100, weightOv.value.weight))
    }

    const hasOverride = !!(incOv || prioOv || weightOv)

    // Language adaptation if track is programming language
    let trackNotes = track.notes
    let trackName = track.trackName
    if (track.trackId === 'track-lang' && interviewLanguage) {
      const langCapitalized = interviewLanguage.charAt(0).toUpperCase() + interviewLanguage.slice(1)
      trackName = `Programming Language (${langCapitalized})`
      trackNotes = `Specialized preparation for technical interview execution using ${langCapitalized}.`
    }

    // 3. Resolve topics under this track
    const trackTopics = topics.filter((t) => t.trackId === track.trackId)
    const effectiveTopics: EffectiveCurriculumTopic[] = []

    for (const topic of trackTopics) {
      const topIncOv = overrideMap.get(`topic:${topic.topicId}:inclusion`)
      if (topIncOv && topIncOv.value.included === false) {
        continue
      }

      let topPriority: CurriculumPriority = topic.priority
      const topPrioOv = overrideMap.get(`topic:${topic.topicId}:priority`)
      if (topPrioOv && typeof topPrioOv.value.priority === 'string') {
        topPriority = topPrioOv.value.priority as CurriculumPriority
      }

      let topWeight = topic.weight
      const topWeightOv = overrideMap.get(`topic:${topic.topicId}:weight`)
      if (topWeightOv && typeof topWeightOv.value.weight === 'number') {
        topWeight = topWeightOv.value.weight
      }

      const isTopicOverridden = !!(topIncOv || topPrioOv || topWeightOv)

      effectiveTopics.push({
        topicId: topic.topicId,
        name: topic.topicName,
        trackId: topic.trackId,
        priority: topPriority,
        weight: topWeight,
        recommendedQuestionCount: topic.recommendedQuestionCount,
        recommendedRevisionDepth: topic.recommendedRevisionDepth,
        origin: isTopicOverridden ? 'user_override' : 'template',
        sortOrder: topic.sortOrder,
      })
    }

    // 4. Resolve patterns under this track (e.g. for DSA)
    const trackPatterns = patterns.filter((p) => p.trackId === track.trackId)
    const effectivePatterns: EffectiveCurriculumPattern[] = []

    for (const pat of trackPatterns) {
      let patPriority = pat.priority
      const patPrioOv = overrideMap.get(`pattern:${pat.patternId}:priority`)
      if (patPrioOv && typeof patPrioOv.value.priority === 'string') {
        patPriority = patPrioOv.value.priority as CurriculumPriority
      }

      effectivePatterns.push({
        patternId: pat.patternId,
        name: pat.patternName,
        trackId: pat.trackId,
        priority: patPriority,
        recommendedAttempts: pat.recommendedAttempts,
        origin: patPrioOv ? 'user_override' : 'template',
        sortOrder: pat.sortOrder,
      })
    }

    effectiveTracks.push({
      trackId: track.trackId,
      name: trackName,
      priority,
      weight,
      sortOrder: track.sortOrder,
      required: track.required,
      notes: trackNotes,
      origin: hasOverride ? 'user_override' : 'template',
      topics: effectiveTopics.sort((a, b) => a.sortOrder - b.sortOrder),
      patterns: effectivePatterns.sort((a, b) => a.sortOrder - b.sortOrder),
    })

    totalWeight += weight
  }

  // 5. Compute Normalized Planning Allocations (weights sum to 100%)
  const planningAllocation: PlanningAllocationSlice[] = effectiveTracks.map((tr) => {
    const percentage = totalWeight > 0 ? Math.round((tr.weight / totalWeight) * 100) : 0
    return {
      trackId: tr.trackId,
      name: tr.name,
      weight: tr.weight,
      percentage,
    }
  })

  // Ensure percentages sum accurately to 100% if tracks exist
  if (planningAllocation.length > 0 && totalWeight > 0) {
    const currentSum = planningAllocation.reduce((sum, item) => sum + item.percentage, 0)
    const diff = 100 - currentSum
    if (diff !== 0) {
      planningAllocation[0].percentage += diff
    }
  }

  const totalTopics = effectiveTracks.reduce((acc, tr) => acc + tr.topics.length, 0)

  return {
    workspaceId,
    templateId: template.id,
    templateName: template.name,
    templateVersionId: version.id,
    versionNumber: version.versionNumber,
    status: overrides.length > 0 ? 'customized' : 'active',
    tracks: effectiveTracks.sort((a, b) => a.sortOrder - b.sortOrder),
    planningAllocation,
    stages: [...stages].sort((a, b) => a.sortOrder - b.sortOrder),
    readinessRequirements,
    totalTracks: effectiveTracks.length,
    totalTopics,
  }
}

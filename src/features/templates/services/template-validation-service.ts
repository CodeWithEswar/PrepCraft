/**
 * PrepCraft Template Validation Service
 * 
 * Rules:
 * - Ensures template integrity before publishing or application.
 * - Enforces version number invariants, positive weights, track/topic relationships.
 * - Protects published versions against illegal mutation.
 */

import type {
  PreparationTemplate,
  TemplateVersion,
  TemplateVersionTrack,
  TemplateVersionTopic,
} from "../types/template.types"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateTemplateIntegrity(params: {
  template: Partial<PreparationTemplate>
  version: Partial<TemplateVersion>
  tracks: TemplateVersionTrack[]
  topics: TemplateVersionTopic[]
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Template Identity Validation
  if (!params.template.name || params.template.name.trim().length === 0) {
    errors.push("Template must have a non-empty name.")
  }
  if (!params.template.slug || params.template.slug.trim().length === 0) {
    errors.push("Template must have a unique slug.")
  }

  // 2. Version Validation
  if (!params.version.versionNumber || params.version.versionNumber <= 0) {
    errors.push("Template version number must be a positive integer.")
  }

  // 3. Track Validation
  if (!params.tracks || params.tracks.length === 0) {
    errors.push("Template must contain at least one preparation track.")
  }

  const trackIds = new Set<string>()
  let totalTrackWeight = 0

  for (const tr of params.tracks) {
    if (trackIds.has(tr.trackId)) {
      errors.push(`Duplicate track assignment detected for track ID: ${tr.trackId}`)
    }
    trackIds.add(tr.trackId)

    if (tr.weight < 0 || tr.weight > 100) {
      errors.push(`Track ${tr.trackName || tr.trackId} has invalid weight: ${tr.weight}. Must be between 0 and 100.`)
    }
    totalTrackWeight += tr.weight
  }

  if (totalTrackWeight === 0 && params.tracks.length > 0) {
    warnings.push("Total track weight is 0. Planning allocation will default to equal distribution.")
  }

  // 4. Topic Validation
  const topicIds = new Set<string>()
  for (const top of params.topics) {
    if (topicIds.has(top.topicId)) {
      errors.push(`Duplicate topic assignment detected for topic ID: ${top.topicId}`)
    }
    topicIds.add(top.topicId)

    if (!trackIds.has(top.trackId)) {
      errors.push(`Topic ${top.topicName || top.topicId} references track ${top.trackId} which is not part of this template.`)
    }

    if (top.recommendedQuestionCount < 0) {
      errors.push(`Topic ${top.topicName || top.topicId} has negative recommended question count.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function assertVersionIsMutable(version: TemplateVersion): void {
  if (version.status === "published" || version.status === "archived") {
    throw new Error(
      `Cannot mutate template version ${version.versionNumber} in '${version.status}' state. Create a new draft version to modify curriculum.`
    )
  }
}

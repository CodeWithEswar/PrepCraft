/**
 * PrepCraft Preparation Template & Curriculum Engine — Core Types
 * Phase 08: Domain Boundary & Contracts
 * 
 * Rules:
 * - Templates define recommendations.
 * - Workspaces own preparation.
 * - Users own progress.
 * - Published template versions are immutable historical definitions.
 */

export type TemplateType = 'general' | 'company' | 'role' | 'company_role' | 'custom'

export type TemplateStatus = 'draft' | 'review' | 'published' | 'deprecated' | 'archived'

export type TemplateVisibility = 'public' | 'internal' | 'private'

export type CurriculumPriority = 'core' | 'high' | 'medium' | 'low' | 'optional'

export type StageType =
  | 'oa'
  | 'coding'
  | 'technical'
  | 'behavioral'
  | 'project'
  | 'system_design'
  | 'managerial'
  | 'other'

export type ReadinessDimension =
  | 'dsa'
  | 'programming_language'
  | 'cs_fundamentals'
  | 'projects'
  | 'behavioral'
  | 'timed_practice'

export type CurriculumEntityOrigin = 'template' | 'user_override'

// Canonical catalog types
export interface CanonicalTrack {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  sortOrder: number
}

export interface CanonicalTopic {
  id: string
  slug: string
  trackId: string
  name: string
  description: string | null
  sortOrder: number
}

export interface CanonicalPattern {
  id: string
  slug: string
  trackId: string
  name: string
  description: string | null
  category: string
  sortOrder: number
}

// Master Template Identity
export interface PreparationTemplate {
  id: string
  slug: string
  name: string
  shortName: string | null
  description: string
  companyId: string | null
  roleId: string | null
  roleFamilyId: string | null
  templateType: TemplateType
  status: TemplateStatus
  visibility: TemplateVisibility
  currentPublishedVersionId: string | null
  currentVersionNumber?: number
  trackCount?: number
  topicCount?: number
  createdAt: string
  updatedAt: string
}

// Version Metadata
export interface TemplateVersion {
  id: string
  templateId: string
  versionNumber: number
  status: TemplateStatus
  changeSummary: string | null
  reviewedAt: string | null
  publishedAt: string | null
  deprecatedAt: string | null
  createdAt: string
  updatedAt: string
}

// Curriculum associations inside a TemplateVersion
export interface TemplateVersionTrack {
  id: string
  templateVersionId: string
  trackId: string
  trackName: string
  priority: CurriculumPriority
  weight: number
  recommendedMinutesPercent: number | null
  sortOrder: number
  required: boolean
  notes: string | null
}

export interface TemplateVersionTopic {
  id: string
  templateVersionId: string
  trackId: string
  topicId: string
  topicName: string
  priority: CurriculumPriority
  weight: number
  recommendedQuestionCount: number
  recommendedRevisionDepth: number
  sortOrder: number
  required: boolean
}

export interface TemplateVersionPattern {
  id: string
  templateVersionId: string
  patternId: string
  patternName: string
  trackId: string
  priority: CurriculumPriority
  recommendedAttempts: number
  sortOrder: number
}

export interface TemplateInterviewStage {
  id: string
  templateVersionId: string
  name: string
  stageType: StageType
  sortOrder: number
  optional: boolean
  description: string | null
}

export interface TemplateReadinessRequirement {
  id: string
  templateVersionId: string
  dimension: ReadinessDimension
  minimumEvidence: string
  weight: number
  required: boolean
}

// Full hydrated detail of a template for browsing & preview
export interface TemplateDetail {
  template: PreparationTemplate
  version: TemplateVersion
  tracks: TemplateVersionTrack[]
  topics: TemplateVersionTopic[]
  patterns: TemplateVersionPattern[]
  stages: TemplateInterviewStage[]
  readinessRequirements: TemplateReadinessRequirement[]
  totalTopicsCount: number
  totalTracksCount: number
}

// Deterministic Recommendation Engine
export interface TemplateRecommendationMatchFactors {
  companyMatch: boolean
  roleMatch: boolean
  roleFamilyMatch: boolean
  isFallback: boolean
}

export interface TemplateRecommendation {
  template: PreparationTemplate
  version: TemplateVersion
  score: number
  reason: string
  isStrongMatch: boolean
  matchFactors: TemplateRecommendationMatchFactors
}

// Effective Workspace Curriculum (Resolved against target, language, and overrides)
export interface EffectiveCurriculumTopic {
  topicId: string
  name: string
  trackId: string
  priority: CurriculumPriority
  weight: number
  recommendedQuestionCount: number
  recommendedRevisionDepth: number
  origin: CurriculumEntityOrigin
  sortOrder: number
}

export interface EffectiveCurriculumPattern {
  patternId: string
  name: string
  trackId: string
  priority: CurriculumPriority
  recommendedAttempts: number
  origin: CurriculumEntityOrigin
  sortOrder: number
}

export interface EffectiveCurriculumTrack {
  trackId: string
  name: string
  priority: CurriculumPriority
  weight: number
  sortOrder: number
  required: boolean
  notes: string | null
  origin: CurriculumEntityOrigin
  topics: EffectiveCurriculumTopic[]
  patterns: EffectiveCurriculumPattern[]
}

export interface PlanningAllocationSlice {
  trackId: string
  name: string
  weight: number
  percentage: number
}

export interface EffectiveWorkspaceCurriculum {
  workspaceId: string
  templateId: string
  templateName: string
  templateVersionId: string
  versionNumber: number
  status: 'active' | 'customized' | 'archived'
  tracks: EffectiveCurriculumTrack[]
  planningAllocation: PlanningAllocationSlice[]
  stages: TemplateInterviewStage[]
  readinessRequirements: TemplateReadinessRequirement[]
  totalTracks: number
  totalTopics: number
}

// Diff Engine for Template Upgrades and Comparison
export interface TopicPriorityDiff {
  topicId: string
  name: string
  trackId: string
  oldPriority: CurriculumPriority
  newPriority: CurriculumPriority
}

export interface TrackWeightDiff {
  trackId: string
  name: string
  oldWeight: number
  newWeight: number
}

export interface CurriculumDiff {
  currentVersionNumber: number
  candidateVersionNumber: number
  tracksAdded: { trackId: string; name: string; priority: CurriculumPriority }[]
  tracksRemoved: { trackId: string; name: string }[]
  topicsAdded: { topicId: string; name: string; trackId: string; priority: CurriculumPriority }[]
  topicsRemoved: { topicId: string; name: string; trackId: string }[]
  priorityChanged: TopicPriorityDiff[]
  weightChanged: TrackWeightDiff[]
  patternsAdded: { patternId: string; name: string; priority: CurriculumPriority }[]
  preservedProgressGuarantee: string
}

export interface TemplateUpgradeAvailability {
  available: boolean
  currentVersionNumber: number
  latestVersionNumber: number
  latestVersionId: string
  changeSummary: string | null
}

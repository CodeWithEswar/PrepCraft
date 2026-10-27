export type MockMode =
  | "coding"
  | "cs_fundamentals"
  | "behavioral"
  | "project_deep_dive"
  | "mixed"
  | "oa"
  | "custom"

export type MockSectionType =
  | "coding"
  | "dsa"
  | "cs_fundamentals"
  | "aptitude"
  | "java"
  | "sql_dbms"
  | "operating_systems"
  | "networks"
  | "behavioral"
  | "project_deep_dive"
  | "custom_question"

export type MockItemStatus = "unseen" | "viewed" | "attempted" | "answered" | "flagged"

export type MockSessionStatus =
  | "ready"
  | "active"
  | "submitting"
  | "submitted"
  | "expired"
  | "abandoned"

export type EvidenceProvenance =
  | "observed"
  | "self_reported"
  | "rule_derived"
  | "automated_analysis"
  | "external_evaluator"

export type EvidenceConfidence = "insufficient" | "limited" | "moderate" | "strong"

export type PerformanceDimension =
  | "problem_solving"
  | "correctness"
  | "complexity"
  | "communication"
  | "testing"
  | "speed"
  | "confidence"

export type DimensionStatus =
  | "stable"
  | "needs_attention"
  | "developing"
  | "strong"
  | "not_evaluated"
  | "no_recent_evidence"
  | "overestimated"

export interface SimulationPolicy {
  mode: MockMode
  totalDurationSeconds: number | null
  pausePolicy: "allowed" | "restricted" | "forbidden"
  navigationPolicy: "free" | "sequential" | "locked"
  hintPolicy: "allowed" | "limited" | "forbidden"
  answerChangePolicy: "allowed" | "restricted"
  autoSubmit: boolean
  questionTimerPolicy: "none" | "target" | "hard_limit"
  showProgress: boolean
  showQuestionStatus: boolean
  allowFlagging: boolean
  allowScratchpad: boolean
  allowCodeExecution: boolean
  reviewPolicyVersion: string
}

export interface MockSectionConfig {
  type: MockSectionType
  title: string
  count: number
  durationMinutes: number
}

export interface SessionBlueprint {
  id: string
  version: number
  name: string
  description: string
  mode: MockMode
  durationMinutes: number
  difficulty: "easy" | "medium" | "hard" | "mixed"
  sourceType: "platform" | "company_template" | "workspace_custom" | "quick_generated"
  sectionsConfig: MockSectionConfig[]
  policySnapshot: SimulationPolicy
  whyRecommended?: string[]
  status: "draft" | "published" | "deprecated" | "archived"
}

export interface MockSessionItem {
  id: string
  sectionId: string
  executionItemId: string
  sourceType: "question" | "concept" | "story" | "project" | "custom"
  sourceId: string
  title: string
  sortOrder: number
  difficultySnapshot: "easy" | "medium" | "hard" | "unspecified"
  targetDurationSeconds: number | null
  status: MockItemStatus
  firstViewedAt: string | null
  completedAt: string | null
  flaggedAt: string | null
  body: string
  topic: string
  constraints?: string
  examples?: { input: string; output: string; explanation: string }[]
  code?: string
  language?: string
  scratchpad?: string
  answer?: string
  hintsAvailable: number
  hints?: { level: number; title: string; body: string; revealedAt?: string }[]
}

export interface MockSessionSection {
  id: string
  mockSessionId: string
  sectionType: MockSectionType
  title: string
  sortOrder: number
  targetDurationSeconds: number | null
  items: MockSessionItem[]
}

export interface MockSession {
  id: string
  workspaceId: string
  userId: string
  executionSessionId: string
  blueprintId: string | null
  blueprintVersion: number
  mode: MockMode
  title: string
  status: MockSessionStatus
  targetRoleId: string | null
  targetCompanyId: string | null
  policySnapshot: SimulationPolicy
  selectionPolicyVersion: string
  evaluationPolicyVersion: string
  startedAt: string
  submittedAt: string | null
  completedAt: string | null
  expiresAt: string | null
  sections: MockSessionSection[]
}

export interface FacetFinding {
  dimension: PerformanceDimension
  title: string
  statusText: string
  status: DimensionStatus
  confidence: EvidenceConfidence
  provenance: EvidenceProvenance
  summary: string
  evidencePoints: string[]
  notEvaluatedReason?: string
}

export interface MockQuestionReviewItem {
  itemId: string
  sectionTitle: string
  title: string
  sortOrder: number
  difficulty: string
  status: MockItemStatus
  actualSeconds: number
  targetSeconds: number | null
  runsCount: number
  submissionsCount: number
  passed: boolean
  firstRunSeconds: number | null
  hintCount: number
  userConfidence?: number | null
  summary: string
}

export interface NextWeekBridgeItem {
  id: string
  title: string
  detail: string
  estimatedMinutes: number
  topic: string
  selected: boolean
}

export interface NextWeekBridgeProposal {
  totalEstimatedMinutes: number
  items: NextWeekBridgeItem[]
  sourceNote: string
}

export interface MockReview {
  id: string
  mockSessionId: string
  workspaceId: string
  userId: string
  mode: MockMode
  title: string
  startedAt: string
  completedAt: string
  durationMinutes: number
  totalQuestions: number
  completedCount: number
  partialCount: number
  unansweredCount: number
  evaluationPolicyVersion: string
  primaryFinding: {
    title: string
    status: DimensionStatus
    confidence: EvidenceConfidence
    provenance: EvidenceProvenance
    whyItMatters: string
    whatHappened: string[]
  }
  whatHeldUp: {
    title: string
    detail: string
    provenance: EvidenceProvenance
  }[]
  facets: Record<PerformanceDimension, FacetFinding>
  timeAllocation: {
    name: string
    section: string
    actualMinutes: number
    targetMinutes: number
    percentage: number
  }[]
  decisionFriction: {
    questionTitle: string
    metric: string
    issue: string
    provenance: EvidenceProvenance
  }[]
  sessionReplay: {
    timeOffset: string
    label: string
    detail?: string
    icon: string
  }[]
  questionReviews: MockQuestionReviewItem[]
  evidenceGaps: {
    dimension: PerformanceDimension
    label: string
    reason: string
    ctaText?: string
  }[]
  sessionDelta?: {
    dimension: string
    previousValue: string
    currentValue: string
    deltaText: string
    comparableCount: number
  } | null
  nextWeekBridge: NextWeekBridgeProposal
}

export interface MockHomeData {
  workspace: {
    id: string
    slug: string
    name: string
    timezone: string
    targetRole?: string | null
    targetCompany?: string | null
    interviewDate?: string | null
  }
  recommendedBlueprint: SessionBlueprint
  blueprints: SessionBlueprint[]
  recentSessions: {
    id: string
    mode: MockMode
    title: string
    dateFormatted: string
    durationMinutes: number
    solvedRatioText: string
    primaryFindingText: string
    hasReview: boolean
  }[]
  readiness: {
    overallPercentage: number
    dimensions: { name: string; percentage: number }[]
  }
  upcomingInterview?: {
    company: string
    role: string
    type: string
    dateFormatted: string
    daysRemaining: number
  } | null
  performanceInsights: {
    id: string
    title: string
    status: DimensionStatus
    statusText: string
    description: string
  }[]
  nextWeekBridge: NextWeekBridgeProposal
}

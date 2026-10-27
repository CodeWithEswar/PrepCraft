export type OnboardingStage =
  | "welcome"
  | "profile"
  | "target"
  | "language"
  | "commitment"
  | "target-date"
  | "workspace"
  | "ready"

export type OnboardingDbState =
  | "not_started"
  | "welcome"
  | "profile"
  | "target"
  | "career_target"
  | "language"
  | "coding_language"
  | "commitment"
  | "study_commitment"
  | "target_date"
  | "workspace"
  | "ready"
  | "completed"

export type RoleFamily =
  | "Software Engineer"
  | "Frontend Engineer"
  | "Backend Engineer"
  | "Full-Stack Engineer"
  | "Mobile Engineer"
  | "Data / ML Engineer"
  | "Other"

export type CodingLanguage = "java" | "python" | "cpp" | "javascript" | "other"

export type StudyDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

export type CommitmentPreset = "light" | "balanced" | "focused" | "intensive" | "custom"

export interface OnboardingDraft {
  userId: string
  targetRoleFamily: RoleFamily | null
  targetRoleName: string | null
  targetCompanyId: string | null
  targetCompanyName: string | null
  customCompanyName: string | null
  preferredCodingLanguage: CodingLanguage | null
  weeklyTargetMinutes: number | null
  studyDays: StudyDay[]
  defaultDailyMinutes: number | null
  hasTargetDate: boolean
  targetDate: string | null
  workspaceName: string | null
  selectedTemplateId: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PreparationTemplateTrack {
  name: string
  minutes: number
  description: string
}

export interface PreparationTemplate {
  id: string
  name: string
  roleFamily: string
  targetCompany: string | null
  description: string
  focusAreas: string[]
  tracks: PreparationTemplateTrack[]
  version: number
  status: "active" | "archived" | "draft"
  lastReviewedAt: string
}

export interface StarterPlanSession {
  day: string
  title: string
  focusArea: string
  allocatedMinutes: number
  items: Array<{
    title: string
    durationMinutes: number
    type: "concept" | "practice" | "revision" | "behavioral"
  }>
}

export interface GeneratedInitialPlan {
  templateId: string
  totalWeeklyMinutes: number
  plannedSessions: number
  focusAreas: string[]
  focusBreakdown: Array<{
    area: string
    minutes: number
    percentage: number
  }>
  firstWeekPlan: StarterPlanSession[]
  starterItems: Array<{
    title: string
    tag: string
    durationMinutes: number
    description: string
  }>
}

export interface WorkspaceBootstrapInput {
  userId: string
  displayName?: string
  workspaceName: string
  roleFamily: RoleFamily
  roleName: string
  companyId?: string | null
  companyName?: string | null
  customCompanyName?: string | null
  preferredCodingLanguage: CodingLanguage
  weeklyTargetMinutes: number
  studyDays: StudyDay[]
  defaultDailyMinutes: number
  targetDate?: string | null
  templateId: string
}

export interface WorkspaceBootstrapResult {
  workspaceId: string
  workspaceSlug: string
  idempotent: boolean
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

export type MutationResult<T = unknown> =
  | { success: true; nextUrl?: string; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> }



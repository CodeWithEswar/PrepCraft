export type PreparationLevel = "foundation" | "developing" | "interview_preparation"
export type InterviewLanguage = "java" | "python" | "cpp" | "javascript_typescript" | "other"
export type PlanningMode = "balanced" | "intense" | "flexible"

export interface CompanyItem {
  id: string
  name: string
  slug: string
  tier: string
  category: string | null
  description: string | null
  logoUrl?: string | null
}

export interface RoleItem {
  id: string
  roleFamily: string
  name: string
  description: string | null
}

export interface TargetDetails {
  workspaceId: string
  roleFamily: string
  roleId: string | null
  roleName: string
  customRoleName: string | null
  companyId: string | null
  companyName: string | null
  customCompanyName: string | null
  targetDate: string | null
  preparationLevel: PreparationLevel
  interviewLanguage: InterviewLanguage
  templateId: string | null
  templateVersion: number
}

export interface ScheduleDetails {
  workspaceId: string
  weeklyTargetMinutes: number
  defaultDailyMinutes: number
  studyDays: string[]
  planningMode: PlanningMode
}

export interface TargetChangeImpact {
  daysRemaining: number | null
  weeksRemaining: number | null
  isTightDeadline: boolean
  weeklyTargetHours: string
  studyDaysCount: number
  calculatedDailyMinutes: number
  requiresPlanRebalance: boolean
  advisoryMessage: string
}

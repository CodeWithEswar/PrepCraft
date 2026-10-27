export type WorkspaceStatus = "active" | "archived"
export type MembershipRole = "owner" | "admin" | "member"
export type MembershipStatus = "active" | "invited" | "disabled" | "revoked"

export interface Workspace {
  id: string
  name: string
  slug: string
  status: WorkspaceStatus
  timezone: string
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface WorkspaceMembership {
  id: string
  workspaceId: string
  userId: string
  role: MembershipRole
  status: MembershipStatus
  joinedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkspacePermissions {
  canView: boolean
  canEditSettings: boolean
  canEditTarget: boolean
  canEditSchedule: boolean
  canArchive: boolean
  canRestore: boolean
  canManageMembers: boolean
  canDelete: boolean
}

export interface WorkspaceTarget {
  id: string
  workspaceId: string
  roleFamily: string
  roleId: string | null
  roleName: string
  customRoleName: string | null
  companyId: string | null
  companyName: string | null
  customCompanyName: string | null
  targetDate: string | null
  preparationLevel: "foundation" | "developing" | "interview_preparation"
  interviewLanguage: "java" | "python" | "cpp" | "javascript_typescript" | "other"
  templateId: string | null
  templateVersion: number
  createdAt: string
  updatedAt: string
}

export interface WorkspacePreferences {
  workspaceId: string
  weeklyTargetMinutes: number
  defaultDailyMinutes: number
  studyDays: string[]
  planningMode: "balanced" | "intense" | "flexible"
  createdAt: string
  updatedAt: string
}

export interface WorkspaceContext {
  workspace: Workspace
  membership: WorkspaceMembership
  target: WorkspaceTarget | null
  preferences: WorkspacePreferences
  permissions: WorkspacePermissions
}

export interface WorkspaceListItem {
  id: string
  name: string
  slug: string
  status: WorkspaceStatus
  targetCompany: string | null
  targetRole: string | null
  targetDate: string | null
  weeklyMinutes: number
  preparationLevel: string | null
  interviewLanguage: string | null
  role: MembershipRole
  updatedAt: string
  companyName?: string | null
  roleName?: string | null
  weeklyTargetMinutes?: number
}

export interface WorkspaceActivityEvent {
  id: string
  workspaceId: string
  userId: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
}

export type MutationResult<T = unknown> =
  | { success: true; data?: T; nextUrl?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

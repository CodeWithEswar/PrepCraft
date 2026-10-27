import type { TaskType, TaskStatus, TaskSource } from "@/types/preparation"
export type { TaskType, TaskStatus, TaskSource } from "@/types/preparation"
export type Criticality = "critical" | "required" | "recommended" | "optional"
export type ReasonCode = "IN_PROGRESS" | "REVISION_DUE" | "OVERDUE" | "WEAK_TOPIC" | "TARGET_CRITICAL" | "INTERVIEW_SOON" | "OA_SOON" | "WEEKLY_TARGET_BEHIND" | "RECENT_MISTAKES" | "SCHEDULED_TODAY" | "OPTIONAL" | "DOMAIN_VARIETY"
export type DailyStatus = "Ahead" | "On Track" | "At Risk" | "Behind" | "Complete" | "Rest Day"
export interface TodayTask {
  id:string; workspaceId:string; planId:string; dayKey:string; title:string; notes:string
  type:TaskType; source:TaskSource; sourceId:string|null; estimatedMinutes:number; required:boolean
  status:TaskStatus; dueAt:string|null; order:number; createdAt:string; startedAt:string|null; completedAt:string|null; version:number
  blocked?:boolean; dependencySatisfied?:boolean; criticality?:Criticality; availableFrom?:string; availableUntil?:string
  /** Source-domain state only; Today never infers evidence or resumability from a local click. */
  evidence?:{revisionState?:"soon"|"today"|"overdue"; weakness?:number; targetAlignment?:number; recentMistakes?:boolean; deadlineKind?:"interview"|"oa"; resumable?:boolean; href?:string; sessionPhase?:"active"|"reflection"}
}
export interface TodayPlan {id:string;workspaceId:string;dayKey:string;timezone:string;status:"active"|"rest";plannedMinutes:number;contextVersion:string;createdAt:string}
export interface TodayContext {
  workspaceId:string;slug:string;name:string;timezone:string;role:string;company:string|null;targetDate:string|null
  weeklyTargetMinutes:number;dailyMinutes:number;studyDays:string[];hasCurriculum:boolean;contextVersion:string;canEdit:boolean;interviewLanguage?:string
}
export type Availability = "ready" | "unavailable" | "error"
export interface FocusSegment {workspaceId:string;start:string;end:string;type:TaskType;taskId?:string}
export interface UpcomingEvent {id:string;workspaceId:string;title:string;at:string;kind:"interview"|"oa"|"reminder"|"milestone";importance:number;href?:string}
/** Each adapter must provide authorized workspace-scoped data, not global user aggregates. */
export interface TodayContributions {
  revision:{state:Availability;tasks:TodayTask[];dueCount:number|null;overdueCount:number|null}
  focus:{state:Availability;segments:FocusSegment[]}
  readiness:{state:Availability;summary:string|null;detail:string|null}
  upcoming:{state:Availability;events:UpcomingEvent[]}
}
export interface RankedTask {task:TodayTask;rank:number;score:number;reasons:ReasonCode[];policyVersion:string;penalties:string[]}
export interface TodaySnapshot {
  context:TodayContext;dayKey:string;generatedAt:string;plan:TodayPlan|null;tasks:TodayTask[];ranked:RankedTask[]
  state:"no_curriculum"|"no_plan"|"active"|"rest"|"complete"|"stale"|"recovery"
  status:DailyStatus|null;statusReason:string;plannedMinutes:number;focusedMinutes:number|null;completedCount:number;requiredCount:number
  revision:TodayContributions["revision"];readiness:TodayContributions["readiness"]
  week:{days:{dayKey:string;minutes:number|null}[];focusedMinutes:number|null;targetMinutes:number;previousDays:{dayKey:string;minutes:number|null}[];previousFocusedMinutes:number|null}
  upcoming:TodayContributions["upcoming"];attention:{id:string;title:string;detail:string;href?:string}[]
}
export interface TodayCommand {kind:"add"|"create_plan"|"rest"|"study"|"review"|"start"|"complete"|"skip"|"defer";slug:string;dayKey:string;taskId?:string;version?:number;title?:string;notes?:string;type?:TaskType;minutes?:number;required?:boolean;destination?:string}
export type TodayMutationResult = {success:true;snapshot:TodaySnapshot}|{success:false;error:string}

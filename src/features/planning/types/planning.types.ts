import type { TaskType, TaskSource, TaskStatus } from "@/types/preparation"

export type GoalKind = "study_time" | "question_count" | "revision_count" | "topic_completion" | "practice_session" | "behavioral_story" | "custom"
export type GoalUnit = "minutes" | "count" | "sessions" | "topics" | "questions"
export interface WeeklyGoal {id:string;title:string;kind:GoalKind;unit:GoalUnit;target:number;trackId:string|null;progress:number|null}
export interface PlanningTask {
  id:string;workspaceId:string;planId:string;day:string;title:string;notes:string;type:TaskType;source:TaskSource;sourceId:string|null
  minutes:number;required:boolean;status:TaskStatus;order:number;version:number;dueAt:string|null;scheduledStart:string|null;scheduledEnd:string|null
  trackId:string|null;topicId:string|null;targetCount:number|null;targetUnit:GoalUnit|null;carryoverFromId:string|null;carryoverCount:number;generationKey:string|null
}
export interface PlanningDay {day:string;planId:string|null;rest:boolean;closed:boolean;capacity:number;capacitySource:"override"|"recurring"|"workspace"|"unset";availableStart:string|null;availableEnd:string|null;tasks:PlanningTask[]}
export interface AvailabilityRule {weekday:number;minutes:number;rest:boolean;start:string|null;end:string|null}
export interface AvailabilityOverride {day:string;minutes:number;rest:boolean;start:string|null;end:string|null}
export interface CurriculumWork {id:string;trackId:string;title:string;trackName:string;priority:"core"|"high"|"medium"|"low"|"optional";type:TaskType;weight:number;weakness?:number}
export interface PlanningContext {workspaceId:string;slug:string;name:string;timezone:string;today:string;company:string|null;role:string;targetDate:string|null;canEdit:boolean;weeklyTargetMinutes:number;defaultDailyMinutes:number;studyDays:string[];curriculumVersion:string;contextVersion:string;hasCurriculum:boolean}
export interface PlanningReview {week:string;notes:string;closedAt:string;summary:{plannedMinutes:number;completedTasks:number;totalTasks:number;focusedMinutes:number|null;carryoverCount:number;observations:string[]}}
export interface PlanningSnapshot {
  context:PlanningContext;week:string;revision:number;days:PlanningDay[];rules:AvailabilityRule[];overrides:AvailabilityOverride[];goals:WeeklyGoal[];carryover:PlanningTask[];curriculum:CurriculumWork[]
  revisionForecast?:{day:string;count:number;known_minutes:number;unknown_durations:number}[]
  review:PlanningReview|null;observations:string[];upcoming:{id:string;title:string;day:string;kind:string}[]
  evidence:{revision:"unavailable"|"ready"|"error";mastery:"unavailable"|"ready"|"error";focus:"unavailable"|"ready"|"error";interviews:"unavailable"|"ready"|"error"};focusDays:{day:string;minutes:number|null}[];generatedAt:string
}
export interface ProposedTask {key:string;existingId:string|null;day:string;title:string;notes:string;type:TaskType;minutes:number;required:boolean;trackId:string|null;topicId:string|null;targetCount:number|null;targetUnit:GoalUnit|null;generationKey:string|null;reason:string}
export interface PlanningProposal {kind:"generate"|"rebalance";policy:string;baseRevision:number;contextVersion:string;week:string;items:ProposedTask[];unplaced:{title:string;minutes:number;reason:string}[];protectedIds:string[];warnings:string[];before:{day:string;load:number;capacity:number}[];after:{day:string;load:number;capacity:number}[];fingerprint:string}
export type PlanningCommand =
  | {kind:"add";day:string;title:string;notes:string;type:TaskType;minutes:number;required:boolean;start?:string;end?:string}
  | {kind:"edit";taskId:string;version:number;title:string;notes:string;minutes:number;required:boolean;start?:string;end?:string}
  | {kind:"move";taskId:string;version:number;day:string}
  | {kind:"reorder";day:string;taskIds:string[]}
  | {kind:"cancel";taskId:string;version:number}
  | {kind:"carry";taskId:string;version:number;day:string}
  | {kind:"availability";rules:AvailabilityRule[];override?:AvailabilityOverride}
  | {kind:"goal";goalId?:string;title:string;goalKind:GoalKind;unit:GoalUnit;target:number;trackId?:string|null}
  | {kind:"delete_goal";goalId:string}
  | {kind:"apply";proposalKind:"generate"|"rebalance";fingerprint:string}
  | {kind:"close";notes:string}
export type PlanningRequest={slug:string;week:string;revision:number;requestId:string;command:PlanningCommand}
export type PlanningResult={success:true;snapshot:PlanningSnapshot}|{success:false;error:string;conflict?:boolean}

export type RevisionOutcome="independent_success"|"minor_assistance"|"major_assistance"|"failed_recall"
export type RevisionState="scheduled"|"snoozed"|"retired"|"archived"
export interface RevisionItem {
 id:string;workspace_id:string;user_id:string;entity_type:"execution_prompt";entity_id:string;origin_session_id:string;state:RevisionState
 due_at:string;interval_days:number;policy_version:string;schedule_reason:string;last_reviewed_at:string;last_outcome:RevisionOutcome
 review_count:number;failure_count:number;independent_streak:number;snooze_count:number;version:number;created_at:string;updated_at:string
 title:string;topic:string;difficulty:string;rank?:number;estimated_duration_ms?:number|null;active_session_id?:string|null
}
export interface RevisionReview {id:string;revision_item_id:string;source_attempt_id:string;reviewed_at:string;outcome:RevisionOutcome;confidence:number|null;duration_ms:number;hint_level:number;previous_interval_days:number|null;next_interval_days:number;previous_due_at:string|null;next_due_at:string;policy_version:string;schedule_reason:string}
export interface RevisionSnooze {id:string;previous_due_at:string;snoozed_until:string;reason:string;created_at:string;undone_at:string|null}
export interface RevisionDetail {item:RevisionItem;history:RevisionReview[];snoozes:RevisionSnooze[];evidence:{independent:number;assisted:number;failed:number};serverNow:string;timezone:string}
export interface RevisionFilters {search:string;state:"all"|"due"|"overdue"|"upcoming"|"retired";outcome:RevisionOutcome|"all";difficulty:string;topic:string}
export interface RevisionCursor {asOf:string;rank:number;due:string;id:string}
export interface RevisionSnapshot {items:RevisionItem[];summary:{total:number;due:number;overdue:number;upcoming:number;knownMinutes:number|null;unknownDurations:number;reinforcement:number;developing:number;stable:number;strong:number};horizonState?:"ready"|"error";horizon:{day:string;count:number;known_minutes:number;unknown_durations:number}[];asOf:string;serverNow:string;workspace:{id:string;slug:string;timezone:string;userId:string;canEdit:boolean};nextCursor:RevisionCursor|null;reconciled?:number}
export type RevisionCommand={kind:"start"|"retire"|"restore"}|{kind:"snooze";until:string;reason:string}|{kind:"undo_snooze";snoozeId:string}
export type RevisionMutationResult={success:true;payload:{sessionId?:string;otherActive?:boolean;snoozeId?:string}}|{success:false;error:string;conflict?:boolean}
export const DEFAULT_FILTERS:RevisionFilters={search:"",state:"all",outcome:"all",difficulty:"all",topic:""}

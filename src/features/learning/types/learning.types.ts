import type { ExecutionSnapshot } from "@/features/execution"
import type { AppIconName } from "@/components/app-icon"
export type SubjectId="aptitude"|"java"|"sql-dbms"|"operating-systems"|"networks"
export type ActivityType="multiple_choice"|"multiple_select"|"numeric_answer"|"short_answer"|"true_false"|"code_exercise"|"sql_exercise"|"scenario"|"ordering"|"matching"|"interview_question"|"concept_review"
export interface LearningSubject{id:SubjectId;name:string;track_id:string;tagline:string;icon:AppIconName;sort_order:number;published_count:number}
export interface LearningTopic{topic_id:string;subject_id:SubjectId;name:string;sort_order:number;planned_count:number;published_count:number;included:boolean}
export interface ConceptSummary{id:string;version:number;topic_id:string;name:string;status:string;summary:string;sort_order:number;subject_id:SubjectId;topic_name:string;bookmarked:boolean;opened_at:string|null;attempts:number;revision_id:string|null}
export interface LearningCatalog{workspace:{id:string;slug:string;userId:string;canEdit:boolean};subjects:LearningSubject[];topics:LearningTopic[];concepts:ConceptSummary[];serverNow:string}
export interface LearningState{concept_id:string;concept_version:number;opened_at:string;bookmarked:boolean;note:string;version:number}
export interface LearningConcept{id:string;version:number;topic_id:string;name:string;summary:string;mental_model:string;worked_example:string;misconception:string;interview_prompt:string;interview_answer:string;diagram:"transaction"|"scheduler"|"runtime"|"request"|null;source_reference:string;author:string;reviewer:string;reviewed_at:string;language_version:string|null}
export interface LearningActivity{id:string;version:number;concept_id:string;concept_version:number;activity_type:ActivityType;title:string;prompt:string;options:string[];difficulty:"easy"|"medium"|"hard";estimated_seconds:number}
export interface ConceptDetail{evidence?:{state:"ready"|"unavailable";level:string;confidence:string;attempts:number;scope:"topic"};revision?:{id:string;due_at:string;interval_days:number;state:string}|null;concept:LearningConcept;activities:LearningActivity[];state:LearningState|null;relations:{id:string;name:string;type:string}[]}
export interface LearningOverview{opened:number;bookmarks:number;attempts:number;correct:number;subjects:{subject_id:SubjectId;opened:number;bookmarks:number}[];continue:{concept_id:string;name:string;subject_id:SubjectId;bookmarked:boolean;opened_at:string}[];due:{id:string;name:string;concept_id:string;due_at:string;interval_days:number}[]}
export type LearningAnswer=string|number|string[]
export interface LearningSession{execution:ExecutionSnapshot;binding:{session_id:string;item_id:string;activity_id:string;activity_version:number;answer:LearningAnswer|null;confidence:number|null;submitted_at:string|null;correct:boolean|null;timed_out:boolean};activity:LearningActivity;feedback:{answer:LearningAnswer;solution:string}|null}
export type ActionResult<T>={ok:true;data:T}|{ok:false;error:string}

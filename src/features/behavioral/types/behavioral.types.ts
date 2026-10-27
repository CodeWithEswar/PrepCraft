import type { ExecutionSnapshot } from "@/features/execution"
export interface BehavioralWorkspace{id:string;slug:string;userId:string;timezone:string;canEdit:boolean}
export interface Framework{id:string;version:number;name:string;description:string;source_type:"platform"|"company_template"|"workspace_custom";source_reference:string|null}
export interface Principle{id:string;framework_id:string;framework_version:number;name:string;description:string;guidance:string;common_mistake:string;sort_order:number;priority:"high"|"medium"|"low"}
export interface BehavioralContext{workspace:BehavioralWorkspace;framework:Framework;frameworks:Framework[];principles:Principle[];asOf:string}
export type StoryStatus="draft"|"developing"|"practice_ready"|"retired"
export type StoryType="project"|"internship"|"academic"|"leadership"|"team"|"personal_project"|"open_source"|"volunteering"|"other"
export interface StoryMapping{id:string;name:string;framework_id:string;framework_version:number;relevance:"primary"|"strong"|"supporting";notes?:string}
export interface StoryRow{id:string;title:string;summary:string;context:string;story_type:StoryType|null;status:StoryStatus;version:number;updated_at:string;mappings:StoryMapping[];last_practiced_at:string|null;practice_count:number;confidence:number|null;cue_level:number|null;revision_id:string|null;due_at:string|null}
export interface Story extends Omit<StoryRow,"mappings"|"last_practiced_at"|"practice_count"|"confidence"|"cue_level"|"revision_id"|"due_at">{situation:string;task:string;action:string;result:string;reflection:string;private_notes:string;period:string;created_at:string;retired_at:string|null}
export type CoverageState="no_story"|"draft"|"needs_practice"|"ready"|"strong"
export interface CoverageRow extends Principle{state:CoverageState;story_count:number;stories:{id:string;title:string;status:StoryStatus;last_at:string|null;confidence:number|null;cues:number|null}[]}
export interface BehavioralPrompt{id:string;framework_id:string;framework_version:number;prompt:string;category:string;difficulty:string;follow_ups:string[];version:number;principles:{id:string;name:string}[];suggested_stories:{id:string;title:string;status:StoryStatus}[]}
export interface PracticeHistory{id:string;session_id:string;story_id:string;title:string;prompt_id:string|null;completed_at:string;duration_ms:number;target_duration_seconds:number|null;cue_level:number;confidence:number;clarity:number;action_specificity:number;result_specificity:number}
export interface BehavioralHome{context:BehavioralContext;stories:StoryRow[];coverage:CoverageRow[]|null;prompts:BehavioralPrompt[]|null;history:PracticeHistory[]}
export interface StoryDetail{story:Story;mappings:StoryMapping[];history:PracticeHistory[];revision:{id:string;due_at:string;state:string;interval_days:number}|null}
export interface BehavioralSession{execution:ExecutionSnapshot;title:string;binding:{session_id:string;item_id:string;story_id:string;story_version:number;prompt_id:string|null;principle_ids:string[];cue_level:number;committed:boolean;retold:boolean|null;confidence:number|null;clarity:number|null;action_specificity:number|null;result_specificity:number|null;reflection:string};cues:Record<string,string>|null}
export interface StoryFilters{search:string;status:string;principle:string;type:string;confidence:string;practice:string;beforeAt?:string;beforeId?:string}
export type BehavioralResult<T>={ok:true;data:T}|{ok:false;error:string;conflict?:boolean}

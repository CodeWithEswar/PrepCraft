import type { TaskType } from "@/types/preparation"
export type ExecutionMode="practice"|"interview"|"oa"
export type ExecutionStatus="active"|"paused"|"completed"|"expired"|"abandoned"
export type CompletionReason="user_finished"|"submitted"|"time_expired"|"abandoned"|"session_invalidated"
export type InterviewPhase="understand"|"clarify"|"approach"|"implement"|"test"|"review"
export type CommunicationItem="assumptions"|"approach"|"complexity"|"edge_cases"|"tradeoffs"
export type AttemptResult="solved_independently"|"solved_small_hint"|"solved_major_hint"|"could_not_solve"
export type MistakeCategory="recognition"|"logic"|"syntax"|"edge_case"|"complexity"|"forgotten_concept"|"communication"|"time_management"
export interface ExecutionPolicy {version:string;mode:ExecutionMode;direction:"up"|"down";pause:"allowed"|"forbidden";hints:"allowed"|"limited"|"forbidden";hintLimit:number;autoFinish:boolean;multipleQuestions:boolean;communication:boolean;thresholds:{attention:number;closing:number}}
export interface ExecutionSession {
  id:string;workspaceId:string;userId:string;mode:ExecutionMode;status:ExecutionStatus;source:"manual"|"task";taskId:string|null;taskType:TaskType
  startedAt:string;pausedAt:string|null;accumulatedPauseMs:number;pauseCount:number;completedAt:string|null;expiresAt:string|null;targetSeconds:number|null;completionReason:CompletionReason|null;policyVersion:string;version:number;currentItemId:string;phase:InterviewPhase;checklist:CommunicationItem[]
}
export interface ExecutionItem {id:string;position:number;title:string;body:string;difficulty:"easy"|"medium"|"hard"|"unspecified";topic:string;constraints:string;examples:{input:string;output:string;explanation:string}[];code:string;language:string;scratchpad:string;answer:string;status:"unseen"|"viewed"|"attempted"|"answered";flagged:boolean;hintsAvailable:number;hints:{level:number;title:string;body:string;revealedAt:string}[]}
export interface AttemptEvidence {id:string;itemId:string;durationMs:number;targetMs:number|null;reflectionStatus:"pending"|"completed";result:AttemptResult|null;approach:string;patternId:string|null;timeComplexity:string;spaceComplexity:string;confidence:number|null;mistakes:MistakeCategory[];notes:string;completedAt:string|null;revisionStatus:"pending"|"scheduled";revisionSchedule?:{itemId:string;intervalDays:number;previousIntervalDays:number|null;dueAt:string;reason:string;policy:string}}
export interface ExecutionEvent {id:string;type:string;at:string;elapsedMs:number;itemId:string|null;phase:InterviewPhase|null;hintLevel:number|null}
export interface ExecutionSnapshot {revisionContext?:{id:string;intervalDays:number;lastOutcome:string;lastReviewedAt:string}|null;session:ExecutionSession;items:ExecutionItem[];attempts:AttemptEvidence[];events:ExecutionEvent[];serverNow:string;workspace:{id:string;slug:string;name:string;timezone:string};patterns:{id:string;name:string}[];clock?:{receivedAt:number;roundTripMs:number};notice?:string}
export interface ExecutionPrompt {topicId?:string|null;title:string;body:string;topic:string;difficulty:ExecutionItem["difficulty"];constraints:string;examples:ExecutionItem["examples"];hints:{title:string;body:string}[]}
export interface ExecutionLaunch {slug:string;mode:ExecutionMode;targetSeconds:number|null;source:"manual"|"task";taskId?:string;prompts:ExecutionPrompt[];requestId:string}
export type ExecutionCommand=
 | {kind:"pause"|"resume"|"finish"|"abandon"|"sync"}
 | {kind:"navigate";itemId:string}
 | {kind:"draft";itemId:string;code:string;language:string;scratchpad:string;answer:string}
 | {kind:"flag";itemId:string;flagged:boolean}
 | {kind:"answer";itemId:string;answered:boolean}
 | {kind:"hint";itemId:string;level:number}
 | {kind:"phase";phase:InterviewPhase}
 | {kind:"checklist";items:CommunicationItem[]}
 | {kind:"debrief_draft"|"debrief";attemptId:string;result:AttemptResult|null;approach:string;patternId:string|null;timeComplexity:string;spaceComplexity:string;confidence:number|null;mistakes:MistakeCategory[];notes:string;completeLinkedTask?:boolean}
export type ExecutionActionResult={success:true;snapshot:ExecutionSnapshot}|{success:false;error:string;conflict?:boolean;snapshot?:ExecutionSnapshot}
export interface ExecutionLobby {topics?:{id:string;name:string}[];workspace:{id:string;slug:string;name:string;timezone:string;userId:string};active:ExecutionSnapshot|null;recent:{id:string;mode:ExecutionMode;title:string;status:ExecutionStatus;startedAt:string;reflectionPending:boolean}[];task:{id:string;title:string;notes:string;minutes:number;type:TaskType}|null;canEdit:boolean}

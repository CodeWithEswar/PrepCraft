import { focusByDay } from "@/lib/time/workspace-calendar"
export type EvidenceState="ready"|"unavailable"|"error"
type Scoped={workspaceId:string}
export interface PlanningEvidencePorts {
  /** Revision owns these projection IDs and their due dates. This adapter cannot create revisions. */
  revision?:(scope:EvidenceScope)=>Promise<(Scoped&{projectionId:string})[]>
  mastery?:(scope:EvidenceScope)=>Promise<(Scoped&{topicId:string;weakness:number})[]>
  focus?:(scope:EvidenceScope)=>Promise<(Scoped&{start:string;end:string})[]>
  interviews?:(scope:EvidenceScope)=>Promise<(Scoped&{id:string;title:string;day:string;kind:"interview"|"oa"})[]>
}
export interface EvidenceScope {workspaceId:string;timezone:string;from:string;to:string;now:string}
/** Absent source domains stay unavailable; a failed provider cannot invent healthy zeroes. */
export async function loadPlanningEvidence(ports:PlanningEvidencePorts,scope:EvidenceScope,focusDays:string[]){
  const keys=["revision","mastery","focus","interviews"] as const
  const results=await Promise.allSettled(keys.map(async key=>{
    const port=ports[key];if(!port)return null
    const rows=await port(scope)
    if(rows.some(row=>row.workspaceId!==scope.workspaceId))throw new Error("Planning evidence scope mismatch")
    return rows
  }))
  const state=Object.fromEntries(keys.map((key,index)=>[key,results[index].status==="rejected"?"error":results[index].value===null?"unavailable":"ready"])) as Record<typeof keys[number],EvidenceState>
  const value=<K extends keyof PlanningEvidencePorts>(key:K):Awaited<ReturnType<NonNullable<PlanningEvidencePorts[K]>>>=>{const result=results[keys.indexOf(key)];return (result.status==="fulfilled"?result.value||[]:[]) as Awaited<ReturnType<NonNullable<PlanningEvidencePorts[K]>>>}
  const rawFocus=value("focus"),focus=rawFocus.filter(segment=>Number.isFinite(Date.parse(segment.start))&&Number.isFinite(Date.parse(segment.end))&&Date.parse(segment.end)<=Date.parse(scope.now)&&Date.parse(segment.end)>Date.parse(segment.start))
  if(focus.length!==rawFocus.length)state.focus="error"
  return {state,revision:value("revision"),mastery:value("mastery").filter(row=>Number.isFinite(row.weakness)&&row.weakness>=0&&row.weakness<=1),focus:state.focus==="ready"?focusByDay(focus,scope.timezone,focusDays):null,upcoming:value("interviews").filter(event=>/^\d{4}-\d{2}-\d{2}$/.test(event.day)&&event.day>=scope.from)}
}
